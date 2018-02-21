import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';
import * as Selectors from '../../selectors';
import * as Actions from '../actions';
import Button from 'common/components/Button';

import { customConnect, I18nPropType } from 'common/connectUtils';
import EditTeamFormInputs from './EditTeamFormInputs';

export class EditTeamModal extends Component {
  static propTypes = {
    I18n: I18nPropType.isRequired,
    cancelModal: PropTypes.func,
    disableModal: PropTypes.bool,
    modalSubtitle: PropTypes.string,
    modalTitle: PropTypes.string,
    showModal: PropTypes.bool.isRequired,
    submitButtonLabel: PropTypes.string,
    submitModal: PropTypes.func
  };

  handleSubmit = event => {
    const { submitModal } = this.props;
    event.preventDefault();
    submitModal();
  };

  render() {
    const {
      I18n,
      modalTitle,
      modalSubtitle,
      showModal,
      disableModal,
      cancelModal,
      submitButtonLabel
    } = this.props;

    const modalProps = {
      fullScreen: false,
      onDismiss: () => {}
    };

    const headerProps = {
      showCloseButton: false,
      title: modalTitle,
      onDismiss: cancelModal
    };
    if (showModal) {
      return (
        <form className="add-team" onSubmit={this.handleSubmit}>
          <Modal {...modalProps}>
            <ModalHeader {...headerProps}>
              <div>{modalSubtitle}</div>
            </ModalHeader>

            <ModalContent>
              <EditTeamFormInputs/>
            </ModalContent>

            <ModalFooter>
              <div>
                <Button className="cancel-button" onClick={cancelModal} disabled={disableModal}>
                  {I18n.t('users.add_new_users.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="add-user-confirm"
                  disabled={disableModal}
                  busy={disableModal}
                >
                  {submitButtonLabel}
                </Button>
              </div>
            </ModalFooter>
          </Modal>
        </form>
      );
    } else {
      return null;
    }
  }
}

const mapStateToProps = state => ({
  disableModal: Selectors.getDisableEditTeamModal(state),
  showModal: Selectors.getShowEditTeamModal(state)
});

const mapDispatchToProps = {
  cancelModal: Actions.cancelEditTeamModal,
  submitModal: Actions.submitEditTeamModal
};

export default customConnect({ mapStateToProps, mapDispatchToProps })(EditTeamModal);
