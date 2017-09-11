import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import { SocrataIcon } from 'common/components';
import I18n from 'common/i18n';
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
import PasswordHintModal from './PasswordHintModal';

class SignUpForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      renderingPasswordHintModal: false
    };

    _.bindAll(this, [
      'closePasswordHintModal',
      'getFormActionUrl',
      'renderPasswordInput',
      'renderPasswordConfirmInput',
      'openPasswordHintModal',
      'validateAndSubmitForm'
    ]);
  }

  getFormActionUrl() {
    const { options } = this.props;
    const { linkingSocial } = options;

    // if we're linking a social account, then we
    // do a POST to our auth0 endpoint that knows about the
    // social account that we're linking
    // otherwise, we're doing a regular signup
    if (linkingSocial) {
      return '/auth/auth0/link';
    } else {
      return '/signup';
    }
  }

  validateAndSubmitForm(event) {
    const { onFormSubmit } = this.props;

    event.preventDefault();

    // this function is called only if the form passes validation in the reducer;
    // note that directly doing submit() on the DOM node skips firing the onSubmit event
    onFormSubmit(() => this.formDomNode.submit());
  }

  openPasswordHintModal(event) {
    event.preventDefault();

    this.setState({ renderingPasswordHintModal: true });
  }

  closePasswordHintModal() {
    this.setState({ renderingPasswordHintModal: false });
  }

  renderPasswordHintModal() {
    if (this.state.renderingPasswordHintModal) {
      return (<PasswordHintModal onDismiss={this.closePasswordHintModal} />);
    }

    return null;
  }

  renderRecaptchaError() {
    const { recaptchaValid, formSubmitted } = this.props;

    if (formSubmitted === true && recaptchaValid === false) {
      return (
        <div styleName="recaptcha-error-message">
          {I18n.t('account.common.validation.recaptcha2')}
        </div>
      );
    }

    return null;
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

  // password fields aren't rendered when doing social linking
  renderPasswordInput(focusOnMount) {
    const { options, onPasswordBlur } = this.props;
    const { linkingSocial } = options;

    if (linkingSocial) {
      return null;
    }

    return (
      <SignUpInput
        focusOnMount={focusOnMount}
        name="password"
        label={I18n.t('account.common.form.password')}
        inputName="signup[password]"
        inputType="password"
        onBlur={onPasswordBlur}>
        <button styleName="password-hint-button" onClick={this.openPasswordHintModal}>
          {I18n.t('account.common.form.password_restrictions')}
          <SocrataIcon name="info" />
        </button>
      </SignUpInput>
    );
  }

  // password fields aren't rendered when doing social linking
  renderPasswordConfirmInput() {
    const { options, onPasswordConfirmBlur } = this.props;
    const { linkingSocial } = options;

    if (linkingSocial) {
      return null;
    }

    return (
      <SignUpInput
        name="passwordConfirm"
        label={I18n.t('account.common.form.confirm_password')}
        inputName="signup[passwordConfirm]"
        inputType="password"
        onBlur={onPasswordConfirmBlur} />
    );
  }

  render() {
    const {
      options,
      onEmailBlur,
      onScreenNameBlur,
      onRecaptchaCallback,
      enteredEmail,
      enteredScreenName } = this.props;

    const {
      authenticityToken,
      recaptchaSitekey
    } = options;

    const focusOnEmail = _.isEmpty(enteredEmail);
    const focusOnScreenName = !focusOnEmail && _.isEmpty(enteredScreenName);
    const focusOnPassword = !focusOnEmail && !focusOnScreenName;

    return (
      <form
        styleName="form"
        action={this.getFormActionUrl()}
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
        {this.renderPasswordHintModal()}
        {this.renderUrlAuthToken()}

        {/* ..... don't ask, yes it's needed */}
        <input type="hidden" name="signup[accept_terms]" id="signup_accept_terms" value="true" />
        <SignUpInput
          focusOnMount={focusOnEmail}
          name="email"
          label={I18n.t('account.common.form.email')}
          inputName="signup[email]"
          inputType="email"
          onBlur={onEmailBlur} />

        <SignUpInput
          focusOnMount={focusOnScreenName}
          name="screenName"
          label={I18n.t('account.common.form.display_name')}
          inputName="signup[screenName]"
          inputType="text"
          onBlur={onScreenNameBlur} />

        {/* Password inputs are not rendered for social linking */}
        {this.renderPasswordInput(focusOnPassword)}
        {this.renderPasswordConfirmInput()}

        {/* This label is needed to pass WAVE */}
        <label htmlFor="g-recaptcha-response" hidden="hidden">Recaptcha Response</label>
        {this.renderRecaptchaError()}

        <ReCAPTCHA
          sitekey={recaptchaSitekey}
          onChange={onRecaptchaCallback}
          onExpired={() => onRecaptchaCallback('')} />

        <div
          styleName="terms"
          dangerouslySetInnerHTML={{ __html: I18n.t('screens.sign_up.terms_html') }} />
        <button styleName="sign-up-button" type="submit">
          {I18n.t('screens.sign_up.form.create_account_button')}
        </button>
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

const mapDispatchToProps = (dispatch, ownProps) => ({
  onEmailBlur: () => dispatch(validateEmail()),
  onScreenNameBlur: () => dispatch(validateScreenName()),
  onPasswordBlur: () => dispatch(validatePassword()),
  onPasswordConfirmBlur: () => dispatch(validatePasswordConfirm()),

  // when we're doing social linking, we skip password validation
  // (since the user will have no password if they are signing up)
  onFormSubmit: (callback) => dispatch(validateForm(callback, ownProps.options.linkingSocial)),
  onRecaptchaCallback: (response) => dispatch(recaptchaCallback(response))
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(SignUpForm, styles));
