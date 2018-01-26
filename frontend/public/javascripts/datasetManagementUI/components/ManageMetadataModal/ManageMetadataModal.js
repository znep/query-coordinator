import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ModalContent, ModalFooter } from 'common/components';
// import SocrataIcon from '../../../common/components/SocrataIcon';
const styles = {};

class ManageMetadataModal extends Component {
  render() {
    const { cancelClose, yesReallyClose, pathToNewOutputSchema } = this.props;

    return (
      <div className="publish-confirmation-modal-inner">
        <h2>Warning</h2>
        <ModalContent>
          <span>boop</span>
        </ModalContent>
        <ModalFooter className={styles.modalFooter}>
          <button onClick={cancelClose} className={styles.cancelButton}>
            {I18n.common.cancel}
          </button>
          <button onClick={() => yesReallyClose(pathToNewOutputSchema)}>close</button>
        </ModalFooter>
      </div>
    );
  }
}

ManageMetadataModal.propTypes = {
  cancelClose: PropTypes.func.isRequired,
  yesReallyClose: PropTypes.func.isRequired,
  pathToNewOutputSchema: PropTypes.string.isRequired
};

export default ManageMetadataModal;
