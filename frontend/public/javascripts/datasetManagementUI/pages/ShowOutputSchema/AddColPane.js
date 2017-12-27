import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AddColForm from 'containers/AddColFormContainer';
import SchemaPreivewTable from 'containers/SchemaPreviewTableContainer';
import FlashMessage from 'containers/FlashMessageContainer';
import styles from './ShowOutputSchema.module.scss';

class AddColPane extends Component {
  constructor() {
    super();

    this.state = {
      flashHeight: 0
    };
  }

  // TODO : factor all this out into a WithFlashMessage HOC
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
      paddingTop: flashVisible ? this.state.flashHeight + 12 : 10
    };

    return (
      <div>
        <div className={styles.flashContainer} ref={flash => this.getHeight(flash)}>
          <FlashMessage />
        </div>
        <div className={styles.addColPane} style={formPadding}>
          <AddColForm />
          <SchemaPreivewTable />
        </div>
      </div>
    );
  }
}

AddColPane.propTypes = {
  flashVisible: PropTypes.bool
};

export default AddColPane;
