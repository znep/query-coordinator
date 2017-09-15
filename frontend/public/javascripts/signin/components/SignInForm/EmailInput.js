import PropTypes from 'prop-types';
import React from 'react';
import cssModules from 'react-css-modules';
import { SocrataIcon } from 'common/components';
import I18n from 'common/i18n';
import PollingInput from './PollingInput';
import styles from './sign-in-form.scss';

class EmailInput extends React.Component {
  render() {
    const { onChange } = this.props;

    return (
      <div>
        <div styleName="icon-container">
          <SocrataIcon name="email" />
        </div>
        <PollingInput
          focusOnMount
          name="user_session[login]"
          aria-label={I18n.t('screens.sign_in.form.email_placeholder')}
          styleName="input-email"
          type="email"
          placeholder={I18n.t('screens.sign_in.form.email_placeholder')}
          spellCheck="false"
          onChange={onChange} />
      </div>
    );
  }
}

EmailInput.propTypes = {
  onChange: PropTypes.func.isRequired
};

export default cssModules(EmailInput, styles);
