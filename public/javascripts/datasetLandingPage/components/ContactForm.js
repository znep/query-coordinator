import _ from 'lodash';
import velocity from 'velocity-animate';
import recaptcha from '../lib/recaptcha';
import classNames from 'classnames';
import breakpoints from '../lib/breakpoints';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import {
  setContactFormField,
  setContactFormRecaptchaLoaded,
  submitContactForm,
  resetContactForm,
  handleContactFormRecaptchaReset
} from '../actions/contactForm';
import ConfirmationMessage from './ContactForm/ConfirmationMessage';
import TextInput from './ContactForm/TextInput';
import TextArea from './ContactForm/TextArea';
import { VALID_EMAIL_REGEX } from '../lib/constants';

var animationDuration = 300;
var animationEasing = [0.645, 0.045, 0.355, 1];

export var ContactForm = React.createClass({
  propTypes: {
    fields: PropTypes.object.isRequired,
    onRecaptchaReset: PropTypes.func,
    recaptchaLoaded: PropTypes.bool.isRequired,
    resetForm: PropTypes.func.isRequired,
    resetRecaptcha: PropTypes.bool.isRequired,
    onClickSend: PropTypes.func.isRequired,
    onChangeFormField: PropTypes.func.isRequired,
    onRecaptchaLoaded: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired
  },

  getInitialState: function() {
    return {
      errors: []
    };
  },

  componentDidMount: function() {
    this.initializeRecaptcha();
  },

  componentDidUpdate: function() {
    var { onRecaptchaReset, resetRecaptcha, status } = this.props;

    if (resetRecaptcha) {
      recaptcha.reset(this.recaptchaId);
      onRecaptchaReset();
    }

    if (_.isEqual(status, 'success') || _.isEqual(status, 'failure')) {
      this.closeModal();
    }
  },

  onClickSend: function(event) {
    event.preventDefault();

    var { onClickSend } = this.props;
    var errors = this.validateForm();

    if (_.some(errors)) {
      var invalidField = ReactDOM.findDOMNode(this).querySelector('[aria-invalid="true"]');
      if (invalidField) {
        invalidField.focus();
      }
      this.setState({ errors: errors });
    } else {
      onClickSend();
    }
  },

  onFieldChange: function(event) {
    var { id, value } = event.target;
    var isInvalid = _.isEmpty(value) || (_.isEqual(id, 'email') && !VALID_EMAIL_REGEX.test(value));

    this.props.onChangeFormField(id, {
      value: value,
      invalid: isInvalid
    });
  },

  initializeRecaptcha: function() {
    var { onRecaptchaLoaded } = this.props;

    if (!serverConfig.featureFlags.defaultToDatasetLandingPage) {
      return;
    }

    recaptcha.init(this.recaptchaContainer, function(id) {
      onRecaptchaLoaded(true);
      this.recaptchaId = id;
    }.bind(this));
  },

  validateForm: function() {
    var self = this;
    var { fields } = this.props;

    return _.reduce(fields, function(result, field, id) {
      if (_.isEqual(id, 'recaptchaResponseToken') && self.isRecaptchaIncomplete()) {
        result.push(I18n.contact_dataset_owner_modal.error_empty_recaptcha);
      } else if (field.invalid) {
        if (!_.isEqual(id, 'email') || _.isEmpty(field.value)) {
          result.push(I18n.contact_dataset_owner_modal[`error_empty_${id}`]);
        } else if (_.isEqual(id, 'email')) {
          result.push(I18n.contact_dataset_owner_modal.error_invalid_email);
        }
      }

      return result;
    }, []);
  },

  // We can't store the Recaptcha response token until we fetch it explicitly, so
  // our state might not accurately reflect whether the user has completed the
  // Recaptcha challenge yet. Instead, verify it right now and store its response
  isRecaptchaIncomplete: function() {
    var { fields, onChangeFormField } = this.props;
    var { recaptchaResponseToken } = fields;

    if (!_.isEmpty(recaptchaResponseToken)) {
      return false;
    }

    var responseToken = recaptcha.getResponseToken(this.recaptchaId);
    onChangeFormField('recaptchaResponseToken', responseToken);

    return _.isEmpty(responseToken);
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
    this.setState({ errors: [] });
    this.initializeRecaptcha();
  },

  closeModal: function() {
    var self = this;
    var element = ReactDOM.findDOMNode(this).querySelector('.modal-container');
    var windowWidth = document.body.offsetWidth;
    var isMobile = windowWidth <= breakpoints.mobile;

    _.delay(function() {
      if (isMobile) {
        velocity(element, {
          left: windowWidth
        }, {
          duration: animationDuration,
          easing: animationEasing,
          complete: self.cleanUpAfterClose
        });
      } else {
        velocity(element, 'fadeOut', {
          duration: 500,
          complete: self.cleanUpAfterClose
        });
      }
    }, 1000);
  },

  renderContactForm: function() {
    var { fields, status, recaptchaLoaded } = this.props;

    var recaptchaPlaceholderSpinner = recaptchaLoaded ?
      '' :
      <div
        aria-label={I18n.contact_dataset_owner_modal.recaptcha_loading}
        className="spinner-default" />;

    var isSending = _.isEqual(status, 'sending');
    var sendButtonClasses = classNames('btn btn-primary btn-sm', {
      sending: isSending
    });

    var sendButtonContent = isSending ?
      <span aria-label={I18n.contact_dataset_owner_modal.sending} className="spinner-default" /> :
      I18n.contact_dataset_owner_modal.send;

    return (
      <div role="dialog" aria-labelledby="contact-owner-title">
        <header className="modal-header">
          <h2 id="contact-owner-title" className="h5 modal-header-title">
            {I18n.contact_dataset_owner_modal.title}
          </h2>
          <button
            aria-label={I18n.close}
            className="btn btn-transparent modal-header-dismiss"
            onClick={this.cleanUpAfterClose}
            data-modal-dismiss>
            <span className="icon-close-2"></span>
          </button>
        </header>

        <section className="modal-content">
          <form id="contact" onSubmit={this.onClickSend}>
            <p className="small">{I18n.contact_dataset_owner_modal.description}</p>
            <TextInput
              field={fields.subject}
              label={I18n.contact_dataset_owner_modal.subject}
              name="subject"
              onChange={this.onFieldChange} />
            <TextArea
              field={fields.message}
              label={I18n.contact_dataset_owner_modal.message}
              name="message"
              onChange={this.onFieldChange} />
            <TextInput
              description={I18n.contact_dataset_owner_modal.email_description}
              field={fields.email}
              label={I18n.contact_dataset_owner_modal.email}
              name="email"
              onChange={this.onFieldChange} />
            <div
              className="recaptcha-container"
              aria-label={I18n.contact_dataset_owner_modal.recaptcha}>
              {recaptchaPlaceholderSpinner}
              <div ref={(el) => this.recaptchaContainer = el} />
            </div>
          </form>
        </section>

        {this.renderErrorMessages()}

        <footer className="modal-actions">
          <button
            id="contact-form-cancel"
            className="btn btn-default btn-sm"
            data-modal-dismiss
            disabled={isSending}
            onClick={this.cleanUpAfterClose}>{I18n.cancel}</button>
          <button
            type="submit"
            id="contact-form-send"
            className={sendButtonClasses}
            disabled={isSending}
            onClick={this.onClickSend}>{sendButtonContent}</button>
        </footer>
      </div>
    );
  },

  renderConfirmationMessage: function() {
    var success = this.props.status === 'success';

    var text = success ?
      I18n.contact_dataset_owner_modal.success_html :
      I18n.contact_dataset_owner_modal.failure_html;

    return <ConfirmationMessage success={success} text={text} />;
  },

  renderErrorMessages: function() {
    var { errors } = this.state;

    if (_.some(errors)) {
      var messages = _.map(errors, function(error, i) {
        return <p key={i}>{error}</p>;
      });

      return (
        <section className="modal-content">
          <div className="alert error validation">{messages}</div>
        </section>
      );
    }
  },

  render: function() {
    if (!serverConfig.featureFlags.defaultToDatasetLandingPage) {
      return null;
    }

    var { status } = this.props;
    var content;

    if (status === 'success' || status === 'failure') {
      content = this.renderConfirmationMessage();
    } else {
      content = this.renderContactForm();
    }

    return (
      <div id="contact-form" className="modal modal-overlay modal-hidden" data-modal-dismiss>
        <div className="modal-container">
          {content}
        </div>
      </div>
    );
  }
});

function mapStateToProps(state) {
  return state.contactForm;
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeFormField: function(field, value) {
      dispatch(setContactFormField(field, value));
    },

    onRecaptchaLoaded: function(value) {
      dispatch(setContactFormRecaptchaLoaded(value));
    },

    onClickSend: function() {
      dispatch(submitContactForm());
    },

    resetForm: function() {
      dispatch(resetContactForm());
    },

    onRecaptchaReset: function() {
      dispatch(handleContactFormRecaptchaReset());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ContactForm);
