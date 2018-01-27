import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ModalContent, ModalFooter } from 'common/components';

class ManageMetadataModal extends Component {
  render() {
    const { cancelClose, yesReallyClose, pathToNewOutputSchema } = this.props;

    return (
      <div id="manage-metadata-modal">
        <ModalContent>
          <span className="dsmp-modal-msg">
            {I18n.edit_metadata.cancel_warning}
            <br />
            {I18n.edit_metadata.cancel_warning_2}
          </span>
        </ModalContent>
        <ModalFooter className="dsmp-modal-footer">
          <button className="btn btn-default" onClick={cancelClose}>
            {I18n.common.cancel}
          </button>
          <button className="btn btn-primary" onClick={() => yesReallyClose(pathToNewOutputSchema)}>
            {I18n.edit_metadata.close}
          </button>
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
