import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, ModalHeader, ModalFooter, ModalContent } from 'socrata-components';
import { closeDataModal } from '../actions/manageData';

export function ManageData({ modalOpen, onDismiss }) {

  if (!modalOpen) {
    return null;
  }

  const modalProps = {
    fullScreen: true,
    onDismiss
  };

  const headerProps = {
    title: I18n.home_pane.data,
    onDismiss
  };

  return (
    <Modal {...modalProps} >
      <ModalHeader {...headerProps} />

      <ModalContent>
        <section className="modal-content">
          Meow!
        </section>
      </ModalContent>

      <ModalFooter>
        <div className="modal-footer-actions">
          <button id="cancel" className="btn btn-default" onClick={onDismiss}>
            {I18n.common.cancel}
          </button>
          <button id="save" className="btn btn-primary" onClick={onDismiss}>
            {I18n.common.save}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

ManageData.propTypes = {
  modalOpen: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  return _.pick(state.data, 'modalOpen');
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ onDismiss: closeDataModal }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageData);
