import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import OptionsPropType from '../OptionsPropType';
import styles from './choose-connection.scss';

class ChooseConnection extends React.Component {
  constructor(props) {
    super(props);

    this.renderSocrataIdButton = this.renderSocrataIdButton.bind(this);
  }

  getConnectionText(auth0Connection) {
    return _.isEmpty(auth0Connection.buttonText) ?
      $.t('screens.sign_in.sign_in_with', { provider: auth0Connection.name }) :
      auth0Connection.buttonText;
  }

  renderConnectionImage(auth0Connection) {
    const { image, name } = auth0Connection;
    if (!_.isEmpty(image)) {
      return (
        <div styleName="button-image-container">
          <img
            styleName="button-image"
            src={image}
            alt={!_.isEmpty(name) ? name : 'SSO Connection'} />
        </div>
      );
    }
  }

  renderSocrataIdButton() {
    if (!this.props.options.hideSocrataId) {
      return (
        <a
          styleName="button"
          onClick={() => { this.props.setLoginFormVisibility(true); }}>
          <div styleName="button-image-container">
            <img
              styleName="button-image"
              src="/stylesheets/images/common/logo.png"
              alt="socrata-logo" />
          </div>
          <span styleName="button-text">
            {$.t('screens.sign_in.sign_in_with', { provider: 'Socrata ID' })}
          </span>
        </a>
      );
    }
  }

  renderConnections() {
    const { onConnectionChosen, options } = this.props;

    return options.connections.map((auth0Connection) => {
      const { connection, image } = auth0Connection;
      const textStyle = _.isEmpty(image) ? 'button-text-no-image' : 'button-text';

      return (
        <a
          key={connection.replace(' ', '')}
          styleName="button"
          onClick={() => { onConnectionChosen(connection); }}>
          {this.renderConnectionImage(auth0Connection)}
          <span styleName={textStyle}>
            {this.getConnectionText(auth0Connection)}
          </span>
        </a>
      );
    });
  }

  render() {
    const { options } = this.props;

    return (
      <div>
        <div styleName="message">{options.message}</div>
        {this.renderSocrataIdButton()}
        {this.renderConnections()}
      </div>
    );
  }
}

ChooseConnection.propTypes = {
  options: OptionsPropType,
  onConnectionChosen: PropTypes.func.isRequired,
  setLoginFormVisibility: PropTypes.func.isRequired
};

export default cssModules(ChooseConnection, styles);
