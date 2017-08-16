import React from 'react';
import cssModules from 'react-css-modules';
import I18n from 'common/i18n';
import styles from './sign-in-form.scss';

class RememberMe extends React.Component {
  render() {
    return (
      <div styleName="remember-me">
        <input
          name="user_session[remember_me]"
          id="remember-me-checkbox"
          type="checkbox"
          styleName="real-checkbox" />
        <label htmlFor="remember-me-checkbox">
          <span styleName="psuedo-checkbox"><span styleName="psuedo-checkbox-check"></span></span>
          {I18n.t('account.common.form.remember_me')}
        </label>
      </div>
    );
  }
}

export default cssModules(RememberMe, styles);
