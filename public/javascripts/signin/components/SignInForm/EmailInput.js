import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import PollingInput from './PollingInput';
import styles from './sign-in-form.scss';
import emailIcon from 'icons/email.svg';

const EmailInput = ({ onChange }) => (
  <div>
    <div styleName="icon-container" dangerouslySetInnerHTML={{ __html: emailIcon }} />
    <PollingInput
      focusOnMount
      name="user_session[login]"
      aria-label={$.t('screens.sign_in.form.email_placeholder')}
      styleName="input-email"
      type="email"
      placeholder={$.t('screens.sign_in.form.email_placeholder')}
      spellCheck="false"
      onChange={onChange} />
  </div>
);

EmailInput.propTypes = {
  onChange: PropTypes.func.isRequired
};

export default cssModules(EmailInput, styles);
