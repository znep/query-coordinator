import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import { SocrataIcon } from 'socrata-components';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from './sign-up-form.scss';
import {
  validateEmail,
  validateScreenName,
  validatePassword,
  validatePasswordConfirm,
  validateForm,
  recaptchaCallback } from '../../actions';
import OptionsPropType from '../../PropTypes/OptionsPropType';
import SignUpInput from './SignUpInput';

class SignUpForm extends React.Component {
  constructor(props) {
    super(props);
    this.validateAndSubmitForm = this.validateAndSubmitForm.bind(this);
  }

  componentDidMount() {
    const { translate } = this.props;

    // add tooltip to password hint...
    $('.passwordHint').socrataTip({
      content: translate('account.common.form.password_requirements_html')
    });
  }

  validateAndSubmitForm(event) {
    const { onFormSubmit } = this.props;

    event.preventDefault();

    // this function is called only if the form passes validation in the reducer;
    // note that directly doing submit() on the DOM node skips firing the onSubmit event
    onFormSubmit(() => this.formDomNode.submit());
  }

  /**
   * Renders a hidden input with an auth token passed in by URL params,
   * for signing up with "bulk created" (aka "future") accounts
   */
  renderUrlAuthToken() {
    const { urlAuthToken } = this.props;

    if (!_.isEmpty(urlAuthToken)) {
      return (
        <input name="signup[authToken]" type="hidden" id="signup_authToken" value={urlAuthToken} />
      );
    }

    return null;
  }

  renderRecaptchaError() {
    const { translate, recaptchaValid, formSubmitted } = this.props;

    if (formSubmitted === true && recaptchaValid === false) {
      return (
        <div styleName="recaptcha-error-message">
          {translate('account.common.validation.recaptcha2')}
        </div>
      );
    }

    return null;
  }

  render() {
    const {
      translate,
      options,
      onEmailBlur,
      onScreenNameBlur,
      onPasswordBlur,
      onPasswordConfirmBlur,
      onRecaptchaCallback,
      enteredEmail,
      enteredScreenName } = this.props;

    const {
      authenticityToken,
      recaptchaSitekey,
      toggleViewMode } = options;

    const focusOnEmail = _.isEmpty(enteredEmail);
    const focusOnScreenName = !focusOnEmail && _.isEmpty(enteredScreenName);
    const focusOnPassword = !focusOnEmail && !focusOnScreenName;

    return (
      <form
        styleName="form"
        action="/signup"
        method="post"
        acceptCharset="UTF-8"
        encType="multipart/form-data"
        noValidate="novalidate"
        onSubmit={this.validateAndSubmitForm}
        ref={(formDomNode) => { this.formDomNode = formDomNode; }} >
        <input name="utf8" type="hidden" value="✓" />
        <input
          name="authenticity_token"
          type="hidden"
          value={authenticityToken} />
        {this.renderUrlAuthToken()}

        {/* ..... don't ask, yes it's needed */}
        <input type="hidden" name="signup[accept_terms]" id="signup_accept_terms" value="true" />
        <SignUpInput
          focusOnMount={focusOnEmail}
          name="email"
          label={translate('account.common.form.email')}
          inputName="signup[email]"
          inputType="email"
          onBlur={onEmailBlur} />

        <SignUpInput
          focusOnMount={focusOnScreenName}
          name="screenName"
          label={translate('account.common.form.display_name')}
          inputName="signup[screenName]"
          inputType="text"
          onBlur={onScreenNameBlur} />

        <SignUpInput
          focusOnMount={focusOnPassword}
          name="password"
          label={translate('account.common.form.password')}
          inputName="signup[password]"
          inputType="password"
          onBlur={onPasswordBlur}>
          <div className="passwordHint" styleName="password-hint">
            {translate('account.common.form.password_restrictions')}
            <SocrataIcon name="info" />
          </div>
        </SignUpInput>

        <SignUpInput
          name="passwordConfirm"
          label={translate('account.common.form.confirm_password')}
          inputName="signup[passwordConfirm]"
          inputType="password"
          onBlur={onPasswordConfirmBlur} />

        {/* This label is needed to pass WAVE */}
        <label htmlFor="g-recaptcha-response" hidden="hidden">Recaptcha Response</label>
        {this.renderRecaptchaError()}

        <ReCAPTCHA
          sitekey={recaptchaSitekey}
          onChange={onRecaptchaCallback}
          onExpired={() => onRecaptchaCallback('')} />

        <div
          styleName="terms"
          dangerouslySetInnerHTML={{ __html: translate('screens.sign_up.terms_html') }} />
        <button styleName="sign-up-button" type="submit">
          {translate('screens.sign_up.form.create_account_button')}
        </button>

        <div styleName="go-to-signin">
          {translate('screens.sign_up.already_have_account')}{' '}
          <a
            onClick={toggleViewMode}
            styleName="signin-link">
              {translate('screens.sign_in.form.sign_in_button')}
          </a>
        </div>
      </form>
    );
  }
}

SignUpForm.propTypes = {
  onEmailBlur: PropTypes.func.isRequired,
  onScreenNameBlur: PropTypes.func.isRequired,
  onPasswordBlur: PropTypes.func.isRequired,
  onPasswordConfirmBlur: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired,
  onRecaptchaCallback: PropTypes.func.isRequired,
  recaptchaValid: PropTypes.bool.isRequired,
  formSubmitted: PropTypes.bool.isRequired,
  translate: PropTypes.func.isRequired,
  options: OptionsPropType.isRequired,
  enteredEmail: PropTypes.string,
  enteredScreenName: PropTypes.string,
  urlAuthToken: PropTypes.string
};

const mapStateToProps = (state) => ({
  recaptchaValid: state.inputs.recaptcha.valid,
  formSubmitted: state.formSubmitted,
  enteredEmail: state.inputs.email.value,
  enteredScreenName: state.inputs.screenName.value,
  urlAuthToken: state.urlAuthToken
});

const mapDispatchToProps = (dispatch) => ({
  onEmailBlur: () => dispatch(validateEmail()),
  onScreenNameBlur: () => dispatch(validateScreenName()),
  onPasswordBlur: () => dispatch(validatePassword()),
  onPasswordConfirmBlur: () => dispatch(validatePasswordConfirm()),
  onFormSubmit: (callback) => dispatch(validateForm(callback)),
  onRecaptchaCallback: (response) => dispatch(recaptchaCallback(response))
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(SignUpForm, styles));
