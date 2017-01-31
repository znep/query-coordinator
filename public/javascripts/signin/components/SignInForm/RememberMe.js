import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './sign-in-form.scss';

function RememberMe({ translate }) {
  return (
    <div styleName="remember-me">
      <input
        name="user_session[remember_me]"
        id="remember-me-checkbox"
        type="checkbox"
        styleName="real-checkbox" />
      <label htmlFor="remember-me-checkbox">
        <span styleName="psuedo-checkbox"><span styleName="psuedo-checkbox-check"></span></span>
        {translate('account.common.form.remember_me')}
      </label>
    </div>
  );
}

RememberMe.propTypes = {
  translate: PropTypes.func.isRequired
};

export default cssModules(RememberMe, styles);
