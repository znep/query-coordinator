import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './sign-in-form.scss';
import emailIcon from 'icons/email.svg';

class EmailInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.domNode.focus();
  }

  handleChange(event) {
    this.props.onChange(event.target.value);
  }

  render() {
    return (
      <div>
        <div styleName="icon-container" dangerouslySetInnerHTML={{ __html: emailIcon }} />
        <input
          name="user_session[login]"
          ref={(domNode) => { this.domNode = domNode; }}
          aria-label={$.t('screens.sign_in.form.email_placeholder')}
          styleName="input-email"
          type="email"
          placeholder={$.t('screens.sign_in.form.email_placeholder')}
          spellCheck="false"
          onChange={this.handleChange} />
      </div>
    );
  }
}

EmailInput.propTypes = {
  onChange: PropTypes.func.isRequired
};

export default cssModules(EmailInput, styles);
