import { ContactModal } from 'components/ContactModal';
import mockView from 'data/mockView';
import recaptcha from 'lib/recaptcha';

describe('components/ContactModal', function() {
  var defaultProps;

  beforeEach(function() {
    defaultProps = {
      view: mockView,
      errors: [],
      fields: {
        email: '',
        subject: '',
        message: ''
      },
      recaptchaLoaded: false,
      setFormField: _.noop,
      setRecaptchaLoaded: _.noop,
      setErrors: _.noop,
      status: '',
      token: '',
      resetForm: _.noop,
      sendForm: _.noop
    };

    sinon.stub(recaptcha, 'init');
    sinon.stub(recaptcha, 'verify');
    sinon.stub(recaptcha, 'reset');
  });

  afterEach(function() {
    recaptcha.init.restore();
    recaptcha.verify.restore();
    recaptcha.reset.restore();
  });

  it('renders an element', function() {
    var element = renderComponent(ContactModal, defaultProps);
    expect(element).to.exist;
  });

  it('stores input values in its state', function() {
    var spy = sinon.spy();
    var element = renderComponent(ContactModal, _.merge(defaultProps, {
      setFormField: spy
    }));

    var subjectInput = element.querySelector('#subject');
    subjectInput.value = 'hello';
    TestUtils.Simulate.change(subjectInput);
    expect(spy.withArgs('subject', 'hello')).to.have.been.called;

    var messageInput = element.querySelector('#message');
    messageInput.value = 'adios';
    TestUtils.Simulate.change(messageInput);
    expect(spy.withArgs('message', 'adios')).to.have.been.called;

    var emailInput = element.querySelector('#email');
    emailInput.value = 'space@wombats.com';
    TestUtils.Simulate.change(emailInput);
    expect(spy.withArgs('email', 'space@wombats.com')).to.have.been.called;
  });

  describe('submitting an invalid form', function() {
    beforeEach(function() {
      recaptcha.verify.returns('valid');
    });

    it('displays provided errors', function() {
      var errorMessages = ['sad', 'pandas', 'in', 'space'];
      var element = renderComponent(ContactModal, _.merge(defaultProps, {
        errors: errorMessages
      }));

      TestUtils.Simulate.click(element.querySelector('#send'));

      var alert = element.querySelector('.alert.error');

      expect(alert.hidden).to.be.false;
      expect(alert.innerText).to.equal(errorMessages.join(''));
    });

    it('does not send the form if the email field is empty', function() {
      var sendFormSpy = sinon.spy();
      var setErrorsSpy = sinon.spy();
      var element = renderComponent(ContactModal, _.merge(defaultProps, {
        fields: {
          subject: 'hello',
          message: 'adios',
          email: ''
        },
        sendForm: sendFormSpy,
        setErrors: setErrorsSpy
      }));

      TestUtils.Simulate.click(element.querySelector('#send'));

      expect(sendFormSpy).to.not.have.been.called;
      expect(setErrorsSpy.withArgs([window.I18n.contact_dataset_owner_modal.error_empty_email])).
        to.have.been.called;
    });

    it('does not send the form if the subject field is empty', function() {
      var sendFormSpy = sinon.spy();
      var setErrorsSpy = sinon.spy();
      var element = renderComponent(ContactModal, _.merge(defaultProps, {
        fields: {
          subject: '',
          message: 'adios',
          email: 'space@pandas.com'
        },
        sendForm: sendFormSpy,
        setErrors: setErrorsSpy
      }));

      TestUtils.Simulate.click(element.querySelector('#send'));

      expect(sendFormSpy).to.not.have.been.called;
      expect(setErrorsSpy.withArgs([window.I18n.contact_dataset_owner_modal.error_empty_subject])).
        to.have.been.called;
    });

    it('does not send the form if the message field is empty', function() {
      var sendFormSpy = sinon.spy();
      var setErrorsSpy = sinon.spy();
      var element = renderComponent(ContactModal, _.merge(defaultProps, {
        fields: {
          subject: 'hello',
          message: '',
          email: 'space@pandas.com'
        },
        sendForm: sendFormSpy,
        setErrors: setErrorsSpy
      }));

      TestUtils.Simulate.click(element.querySelector('#send'));

      expect(sendFormSpy).to.not.have.been.called;
      expect(setErrorsSpy.withArgs([window.I18n.contact_dataset_owner_modal.error_empty_message])).
        to.have.been.called;
    });

    it('does not send the form if the email field is invalid', function() {
      var sendFormSpy = sinon.spy();
      var setErrorsSpy = sinon.spy();
      var element = renderComponent(ContactModal, _.merge(defaultProps, {
        fields: {
          subject: 'hello',
          message: 'adios',
          email: 'pandas'
        },
        sendForm: sendFormSpy,
        setErrors: setErrorsSpy
      }));

      TestUtils.Simulate.click(element.querySelector('#send'));

      expect(sendFormSpy).to.not.have.been.called;
      expect(setErrorsSpy.withArgs([window.I18n.contact_dataset_owner_modal.error_invalid_email])).
        to.have.been.called;
    });

    it('does not send the form if the Recaptcha is not filled in', function() {
      recaptcha.verify.returns(undefined);
      var sendFormSpy = sinon.spy();
      var setErrorsSpy = sinon.spy();
      var element = renderComponent(ContactModal, _.merge(defaultProps, {
        fields: {
          subject: 'hello',
          message: 'adios',
          email: 'pandas@space.com'
        },
        sendForm: sendFormSpy,
        setErrors: setErrorsSpy
      }));

      TestUtils.Simulate.click(element.querySelector('#send'));

      expect(sendFormSpy).to.not.have.been.called;
      expect(setErrorsSpy.withArgs([window.I18n.contact_dataset_owner_modal.error_empty_recaptcha])).
        to.have.been.called;
    });
  });

  describe('submitting a valid form', function() {
    beforeEach(function() {
      recaptcha.verify.returns('valid');
    });

    it('disables buttons and displays a spinner on the submit button', function() {
      var element = renderComponent(ContactModal, _.merge(defaultProps, {
        status: 'sending'
      }));

      var cancelButton = element.querySelector('#cancel');
      var sendButton = element.querySelector('#send');

      expect(cancelButton).to.be.disabled;
      expect(sendButton).to.be.disabled;
      expect(sendButton.querySelector('.spinner-default')).to.be.defined;
    });

    it('on success it displays a success alert', function() {
      var element = renderComponent(ContactModal, _.merge(defaultProps, {
        status: 'success'
      }));

      var successMessage = element.querySelector('.alert.success');

      expect(successMessage).to.be.defined;
      expect(successMessage.innerHTML).to.equal(I18n.contact_dataset_owner_modal.success_html);
    });

    it('on failure it displays a failure alert', function() {
      var element = renderComponent(ContactModal, _.merge(defaultProps, {
        status: 'failure'
      }));

      var failureMessage = element.querySelector('.alert.error');

      expect(failureMessage).to.be.defined;
      expect(failureMessage.innerHTML).to.equal(I18n.contact_dataset_owner_modal.failure_html);
    });
  });
});
