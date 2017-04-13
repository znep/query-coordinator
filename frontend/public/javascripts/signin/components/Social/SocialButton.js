import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { SocrataIcon } from 'socrata-components';
import styles from './social.scss';

class SocialButton extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.props.doAuth0Login({
      connection: this.props.connectionName
    });
  }

  render() {
    return (
      <div onClick={this.handleClick} styleName={this.props.style}>
        <SocrataIcon name={this.props.icon} />
      </div>
    );
  }
}

SocialButton.propTypes = {
  doAuth0Login: PropTypes.func.isRequired,
  connectionName: PropTypes.string.isRequired,
  style: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired
};

export default cssModules(SocialButton, styles);