import PropTypes from 'prop-types';
import React, { Component } from 'react';
import FlashMessage from 'containers/FlashMessageContainer';
import styles from './WithFlash.scss';

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
    const { flashVisible } = this.props;

    let formPadding = {
      paddingTop: flashVisible ? this.state.flashHeight + 12 : 0
    };

    return (
      <div className={styles.container}>
        <div className={styles.flashContainer} ref={flash => this.getHeight(flash)}>
          <FlashMessage />
        </div>
        <div style={formPadding}>{this.props.children}</div>
      </div>
    );
  }
}

WithFlash.propTypes = {
  flashVisible: PropTypes.bool,
  children: PropTypes.object
};

export default WithFlash;

