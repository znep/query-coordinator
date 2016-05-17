import _ from 'lodash';
import velocity from 'velocity-animate';
import recaptcha from '../lib/recaptcha';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';

var contactFormData = window.contactFormData;
var mobileBreakpoint = 420;
var animationDuration = 300;
var animationEasing = [0.645, 0.045, 0.355, 1];

export var ContactModal = React.createClass({
  propTypes: {
    fields: PropTypes.object.isRequired,
    errors: PropTypes.array.isRequired,
    recaptchaLoaded: PropTypes.bool.isRequired,
    resetForm: PropTypes.func.isRequired,
    sendForm: PropTypes.func.isRequired,
    setFormField: PropTypes.func.isRequired,
    setRecaptchaLoaded: PropTypes.func.isRequired,
    setErrors: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired
  },

  componentDidMount: function() {
    this.initializeRecaptcha();
  },

  componentDidUpdate: function() {
    var { status } = this.props;

    if (_.isEqual(status, 'success') || _.isEqual(status, 'failure')) {
      this.closeModal();
    }
  },

  initializeRecaptcha: function() {
    var { setRecaptchaLoaded } = this.props;

    if (!contactFormData.contactFormEnabled) {
      return;
    }

    recaptcha.init(this.recaptchaContainer, function(id) {
      setRecaptchaLoaded(true);
      this.recaptchaId = id;
    }.bind(this));
  },

  onFieldChange: function(event) {
    var { id, value } = event.target;

    this.props.setFormField(id, value);
  },

  validateForm: function() {
    var self = this;
    var { fields } = this.props;

    var errors = [];

    _.each(fields, function(value, id) {
      if (_.isEmpty(value)) {
        errors.push(I18n.contact_dataset_owner_modal[`error_empty_${id}`]);
      } else if (_.isEqual(id, 'email') && self.isEmailInvalid(value)) {
        errors.push(I18n.contact_dataset_owner_modal.error_invalid_email);
      }
    });

    if (this.isRecaptchaInvalid()) {
      errors.push(I18n.contact_dataset_owner_modal.error_empty_recaptcha);
    }

    return errors;
  },

  isEmailInvalid: function(email) {
    return _.isEmpty(email.match(/.+@.+\..+/i));
  },

  isRecaptchaInvalid: function() {
    var response = recaptcha.verify(this.recaptchaId);
    return _.isEmpty(response);
  },

  renderErrorMessages: function() {
    var { errors } = this.props;

    if (!_.isEmpty(errors)) {
      var messages = _.map(errors, function(error, i) {
        return <p key={i}>{error}</p>;
      });

      return (
        <section className="modal-content">
          <div className="alert error">{messages}</div>
        </section>
      );
    }
  },

  cleanUpAfterClose: function() {
    var { resetForm } = this.props;
    var element = ReactDOM.findDOMNode(this);

    element.classList.add('modal-hidden');

    var container = element.querySelector('.modal-container');

    // these attributes are set by velocity's transitions
    container.style.left = '';
    container.style.display = '';
    container.style.opacity = '';

    resetForm();
    this.initializeRecaptcha();
  },

  closeModal: function() {
    var self = this;
    var element = ReactDOM.findDOMNode(this).querySelector('.modal-container');

    _.delay(function() {
      var windowWidth = document.body.offsetWidth;

      if (windowWidth > mobileBreakpoint) {
        velocity(element, 'fadeOut', {
          duration: 500,
          complete: self.cleanUpAfterClose
        });
      } else {
        velocity(element, {
          left: windowWidth
        }, {
          duration: animationDuration,
          easing: animationEasing,
          complete: self.cleanUpAfterClose
        });
      }
    }, 1000);
  },

  submitForm: function(event) {
    event.preventDefault();

    var { setErrors, sendForm } = this.props;
    var errors = this.validateForm();

    if (!_.isEmpty(errors)) {
      setErrors(errors);
    } else {
      sendForm();
    }
  },

  renderInitialContent: function() {
    var { fields, status, recaptchaLoaded } = this.props;

    var recaptchaPlaceholderSpinner = recaptchaLoaded ?
      '' :
      <div className="spinner-default" />;

    var isSending = _.isEqual(status, 'sending');
    var sendButtonClasses = `btn btn-primary btn-sm ${isSending ? 'sending' : ''}`;
    var sendButtonContent = isSending ?
      <span className="spinner-default" /> :
      I18n.contact_dataset_owner_modal.send;

    return (
      <div>
        <header className="modal-header">
          <h1 className="h5 modal-header-title">{I18n.contact_dataset_owner_modal.title}</h1>
          <button className="btn btn-transparent modal-header-dismiss" data-modal-dismiss>
            <span className="icon-close-2"></span>
          </button>
        </header>

        <form id="contact" onSubmit={this.submitForm}>
          <section className="modal-content">
            <p className="small">{I18n.contact_dataset_owner_modal.description}</p>

            <label htmlFor="subject" className="block-label">{I18n.contact_dataset_owner_modal.subject}</label>
            <input
              id="subject"
              className="text-input subject"
              type="text"
              value={fields.subject}
              onChange={this.onFieldChange} />

            <label htmlFor="message" className="block-label">{I18n.contact_dataset_owner_modal.message}</label>
            <textarea
              id="message"
              className="text-input text-area message"
              type="text"
              value={fields.message}
              onChange={this.onFieldChange}></textarea>

            <label htmlFor="email" className="block-label">
              {I18n.contact_dataset_owner_modal.email}
              <span className="x-small quiet">{I18n.contact_dataset_owner_modal.email_description}</span>
            </label>
            <input
              id="email"
              className="text-input email"
              type="text"
              value={fields.email}
              onChange={this.onFieldChange} />

            <div className="recaptcha-container">
              {recaptchaPlaceholderSpinner}
              <div ref={(el) => this.recaptchaContainer = el} />
            </div>
          </section>

          {this.renderErrorMessages()}

          <footer className="modal-actions">
            <a
              id="cancel"
              className="btn btn-default btn-sm"
              data-modal-dismiss
              disabled={isSending}
              onClick={this.resetState}>{I18n.cancel}</a>
            <button
              type="submit"
              id="send"
              className={sendButtonClasses}
              disabled={isSending}
              onClick={this.submitForm}>{sendButtonContent}</button>
          </footer>
        </form>
      </div>
    );
  },

  renderSuccessMessage: function() {
    return (
      <section className="modal-content">
        <div
          className="alert success"
          dangerouslySetInnerHTML={{__html: I18n.contact_dataset_owner_modal.success_html}} />
      </section>
    );
  },

  renderFailureMessage: function() {
    return (
      <section className="modal-content">
        <div
          className="alert error"
          dangerouslySetInnerHTML={{__html: I18n.contact_dataset_owner_modal.failure_html}} />
      </section>
    );
  },

  contentToRender: function() {
    var { status } = this.props;

    switch (status) {
      case 'success':
        return this.renderSuccessMessage();
      case 'failure':
        return this.renderFailureMessage();
      default:
        return this.renderInitialContent();
    }
  },

  render: function() {
    // TODO: Remove this feature flag check once we've verified recaptcha 2.0 works as expected
    if (!contactFormData.contactFormEnabled) {
      return null;
    }

    return (
      <div id="contact-modal" className="modal modal-overlay modal-hidden" data-modal-dismiss>
        <div className="modal-container">
          {this.contentToRender()}
        </div>
      </div>
    );
  }
});

export default ContactModal;
