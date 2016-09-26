import React from 'react';
import cssModules from 'react-css-modules';
import styles from './sign-in-form.scss';

function RememberMe() {
  return (
    <div styleName="remember-me">
      <input name="user_session[remember_me]" id="remember-me-checkbox" type="checkbox" />
      <label htmlFor="remember-me-checkbox">
        <span styleName="psuedo-checkbox"><span styleName="psuedo-checkbox-check"></span></span>
        {$.t('account.common.form.remember_me')}
      </label>
    </div>
  );
}

export default cssModules(RememberMe, styles);
