import PropTypes from 'prop-types';
import React, { Component } from 'react';
import FlashMessage from 'datasetManagementUI/containers/FlashMessageContainer';

class WithFlash extends Component {
  constructor() {
    super();

    this.state = {
      flashHeight: 0
    };

    this.getHeight = this.getHeight.bind(this);
  }

  getHeight(node) {
    if (!node) {
      return;
    }

    if (node.offsetHeight !== this.state.flashHeight) {
      this.setState({
        flashHeight: node.offsetHeight
      });
    }
  }

  render() {
    const { flashVisible, useFlexStyles } = this.props;

    let formPadding = {
      paddingTop: flashVisible ? this.state.flashHeight + 12 : 0
    };

    return (
      <div id="with-flash">
        <div className={useFlexStyles ? 'dsmp-flex-container' : 'dsmp-container'}>
          <div className="dsmp-flash-container" ref={flash => this.getHeight(flash)}>
            <FlashMessage />
          </div>
          <div style={formPadding}>{this.props.children}</div>
        </div>
      </div>
    );
  }
}

WithFlash.propTypes = {
  useFlexStyles: PropTypes.bool,
  flashVisible: PropTypes.bool,
  children: PropTypes.object
};

export default WithFlash;
