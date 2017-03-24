import { ContactForm } from 'components/ContactForm';
import mockView from 'data/mockView';
import recaptcha from 'lib/recaptcha';

describe('components/ContactForm', function() {
  var defaultProps;

  beforeEach(function() {
    defaultProps = {
      view: mockView,
      fields: {
        email: { value: '', invalid: true },
        subject: { value: '', invalid: true },
        message: { value: '', invalid: true },
        recaptchaResponseToken: ''
      },
      onRecaptchaReset: _.noop,
      recaptchaLoaded: false,
      onChangeFormField: _.noop,
      onRecaptchaLoaded: _.noop,
      status: '',
      token: '',
      resetForm: _.noop,
      resetRecaptcha: false,
      onClickSend: _.noop
    };

    sinon.stub(recaptcha, 'init');
    sinon.stub(recaptcha, 'getResponseToken');
    sinon.stub(recaptcha, 'reset');
  });

  afterEach(function() {
    recaptcha.init.restore();
    recaptcha.getResponseToken.restore();
    recaptcha.reset.restore();
  });

  it('renders an element', function() {
    var element = renderComponent(ContactForm, defaultProps);
    expect(element).to.exist;
  });

  it('stores input values in its state', function() {
    var spy = sinon.spy();
    var element = renderComponent(ContactForm, _.merge(defaultProps, {
      onChangeFormField: spy
    }));

    var subjectInput = element.querySelector('#subject');
    subjectInput.value = 'hello';
    TestUtils.Simulate.change(subjectInput);
    expect(spy.withArgs('subject', { value: 'hello', invalid: false })).to.have.been.called;

    var messageInput = element.querySelector('#message');
    messageInput.value = 'adios';
    TestUtils.Simulate.change(messageInput);
    expect(spy.withArgs('message', { value: 'adios', invalid: false })).to.have.been.called;

    var emailInput = element.querySelector('#email');
    emailInput.value = 'space@wombat.co';
    TestUtils.Simulate.change(emailInput);
    expect(spy.withArgs('email', { value: 'space@wombat.co', invalid: false })).to.have.been.called;
  });

  describe('submitting an invalid form', function() {
    beforeEach(function() {
      recaptcha.getResponseToken.returns('wombats-in-top-hats');
    });

    it('displays validation errors', function() {
      var element = renderComponent(ContactForm, defaultProps);

      TestUtils.Simulate.click(element.querySelector('#contact-form-send'));

      var alert = element.querySelector('.alert.error');

      expect(alert.hidden).to.be.false;
    });

    it('does not send the form if the email field is empty', function() {
      var onClickSendSpy = sinon.spy();
      var element = renderComponent(ContactForm, _.merge(defaultProps, {
        fields: {
          subject: { value: 'hello', invalid: false },
          message: { value: 'adios', invalid: false },
          email: { value: '', invalid: true }
        },
        onClickSend: onClickSendSpy,
      }));

      TestUtils.Simulate.click(element.querySelector('#contact-form-send'));

      expect(onClickSendSpy).to.not.have.been.called;
    });

    it('does not send the form if the subject field is empty', function() {
      var onClickSendSpy = sinon.spy();
      var element = renderComponent(ContactForm, _.merge(defaultProps, {
        fields: {
          subject: { value: '', invalid: true },
          message: { value: 'adios', invalid: false },
          email: { value: 'space@pandas.com', invalid: false }
        },
        onClickSend: onClickSendSpy,
      }));

      TestUtils.Simulate.click(element.querySelector('#contact-form-send'));

      expect(onClickSendSpy).to.not.have.been.called;
    });

    it('does not send the form if the message field is empty', function() {
      var onClickSendSpy = sinon.spy();
      var element = renderComponent(ContactForm, _.merge(defaultProps, {
        fields: {
          subject: { value: 'hello', invalid: false },
          message: { value: '', invalid: true },
          email: { value: 'space@pandas.com', invalid: false }
        },
        onClickSend: onClickSendSpy,
      }));

      TestUtils.Simulate.click(element.querySelector('#contact-form-send'));

      expect(onClickSendSpy).to.not.have.been.called;
    });

    it('does not send the form if the email field is invalid', function() {
      var onClickSendSpy = sinon.spy();
      var element = renderComponent(ContactForm, _.merge(defaultProps, {
        fields: {
          subject: { value: 'hello', invalid: false },
          message: { value: 'adios', invalid: false },
          email: { value: 'pandas', invalid: true }
        },
        onClickSend: onClickSendSpy,
      }));

      TestUtils.Simulate.click(element.querySelector('#contact-form-send'));

      expect(onClickSendSpy).to.not.have.been.called;
    });

    it('does not send the form if the Recaptcha is not filled in', function() {
      recaptcha.getResponseToken.returns('');
      var onClickSendSpy = sinon.spy();
      var element = renderComponent(ContactForm, _.merge(defaultProps, {
        fields: {
          subject: { value: 'hello', invalid: false },
          message: { value: 'adios', invalid: false },
          email: { value: 'space@pandas.com', invalid: false }
        },
        onClickSend: onClickSendSpy,
      }));

      TestUtils.Simulate.click(element.querySelector('#contact-form-send'));

      expect(onClickSendSpy).to.not.have.been.called;
    });
  });

  describe('submitting a valid form', function() {
    beforeEach(function() {
      recaptcha.getResponseToken.returns('wombats-in-top-hats');
    });

    it('disables buttons and displays a spinner on the submit button', function() {
      var element = renderComponent(ContactForm, _.merge(defaultProps, {
        status: 'sending'
      }));

      var cancelButton = element.querySelector('#contact-form-cancel');
      var sendButton = element.querySelector('#contact-form-send');

      expect(cancelButton).to.be.disabled;
      expect(sendButton).to.be.disabled;
      expect(sendButton.querySelector('.spinner-default')).to.be.defined;
    });

    it('on success it displays a success alert', function() {
      var element = renderComponent(ContactForm, _.merge(defaultProps, {
        status: 'success'
      }));

      var successMessage = element.querySelector('.alert.success');

      expect(successMessage).to.be.defined;
      expect(successMessage.innerHTML).to.equal(I18n.contact_dataset_owner_modal.success_html);
    });

    it('on failure it displays a failure alert', function() {
      var element = renderComponent(ContactForm, _.merge(defaultProps, {
        status: 'failure'
      }));

      var failureMessage = element.querySelector('.alert.error');

      expect(failureMessage).to.be.defined;
      expect(failureMessage.innerHTML).to.equal(I18n.contact_dataset_owner_modal.failure_html);
    });

    it('on Recaptcha verification failure it resets the Recaptcha widget', function() {
      var node = document.createElement('div');
      ReactDOM.render(<ContactForm {...defaultProps} />, node);

      var newProps = _.merge(defaultProps, {
        resetRecaptcha: true,
        errors: ['bad recaptcha']
      });
      ReactDOM.render(<ContactForm {...newProps} />, node);

      expect(recaptcha.reset).to.have.been.called;
    });
  });
});
