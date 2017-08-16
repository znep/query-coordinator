import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { SocrataIcon } from 'common/components';
import I18n from 'common/i18n';
import styles from './sign-in-form.scss';

class EmailInput extends React.Component {
  componentDidMount() {
    // focus on the dom node as soon as the page loads
    this.domNode.focus();
  }

  render() {
    const { onChange } = this.props;

    return (
      <div>
        <div styleName="icon-container">
          <SocrataIcon name="email" />
        </div>
        <input
          ref={(domNode) => { this.domNode = domNode; }}
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
