import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { SocrataIcon } from 'common/components';
import PollingInput from './PollingInput';
import styles from './sign-in-form.scss';

const EmailInput = ({ onChange, translate }) => (
  <div>
    <div styleName="icon-container">
      <SocrataIcon name="email" />
    </div>
    <PollingInput
      focusOnMount
      name="user_session[login]"
      aria-label={translate('screens.sign_in.form.email_placeholder')}
      styleName="input-email"
      type="email"
      placeholder={translate('screens.sign_in.form.email_placeholder')}
      spellCheck="false"
      onChange={onChange} />
  </div>
);

EmailInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  translate: PropTypes.func.isRequired
};

export default cssModules(EmailInput, styles);
