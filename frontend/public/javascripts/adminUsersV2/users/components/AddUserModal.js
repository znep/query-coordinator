import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect as fullConnect, I18nPropType } from '../../utils';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';
import RolePicker from '../../roles/components/RolePicker';
import Button from 'common/components/Button';
import ErrorList from '../../components/ErrorList';
import * as Actions from '../actions';
import * as Selectors from '../../selectors';

export class AddUserModal extends Component {
  static propTypes = {
    I18n: I18nPropType.isRequired,
    cancelAddUsersModal: PropTypes.func.isRequired,
    errors: PropTypes.array,
    modalDisabled: PropTypes.bool,
    showModal: PropTypes.bool.isRequired,
    submitAddUsersModal: PropTypes.func.isRequired
  };

  componentDidUpdate() {
    const { showModal } = this.props;
    if (showModal) {
      this.textArea.focus();
    }
  }

  cancelModal = () => {
    const { cancelAddUsersModal } = this.props;
    cancelAddUsersModal();
  };

  submitNewUsersForm = event => {
    event.preventDefault();
    const { submitAddUsersModal } = this.props;
    submitAddUsersModal();
  };

  handleRoleChange = roleId => {
    const { changeAddUsersForm } = this.props;
    changeAddUsersForm(this.textArea.value, roleId);
  };

  handleChange = () => {
    const { changeAddUsersForm, roleId } = this.props;
    changeAddUsersForm(this.textArea.value, roleId);
  };

  render() {
    const { I18n, errors, showModal, modalDisabled, roleId, emails } = this.props;
    const modalProps = {
      fullScreen: false,
      onDismiss: () => {}
    };
    const headerProps = {
      showCloseButton: false,
      title: I18n.t('users.add_new_users.add_users'),
      onDismiss: () => {
        this.cancelModal();
      }
    };
    if (showModal) {
      return (
        <form onSubmit={this.submitNewUsersForm} className="add-user">
          <Modal {...modalProps}>
            <ModalHeader {...headerProps}>
              <div>{I18n.t('users.add_new_users.subtitle')}</div>
            </ModalHeader>

            <ModalContent>
              <label className="block-label" htmlFor="add-user-emails">
                {I18n.t('users.add_new_users.emails_label')}:
              </label>
              <textarea
                onChange={this.handleChange}
                value={emails}
                disabled={modalDisabled}
                ref={ref => (this.textArea = ref)}
                className="add-user-emails text-input text-area"
                placeholder={I18n.t('users.add_new_users.emails_placeholder')}
                id="add-user-emails"
              />
              <label className="block-label">{I18n.t('users.add_new_users.role_label')}:</label>
              <RolePicker
                disabled={modalDisabled}
                roleId={roleId}
                onRoleChange={this.handleRoleChange}
                placeholder={I18n.t('users.add_new_users.role_placeholder')}
              />
              <ErrorList errors={errors} />
            </ModalContent>

            <ModalFooter>
              <div>
                <Button
                  type="button"
                  className="cancel-button"
                  onClick={this.cancelModal}
                  disabled={modalDisabled}
                >
                  {I18n.t('users.add_new_users.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="add-user-confirm"
                  disabled={modalDisabled}
                  busy={modalDisabled}
                >
                  {I18n.t('users.add_new_users.add_users')}
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
  roleId: Selectors.getAddUsersFormRoleId(state),
  emails: Selectors.getAddUsersFormEmails(state),
  modalDisabled: Selectors.getAddUsersModalDisabled(state),
  showModal: Selectors.getShowAddUsersModal(state),
  errors: Selectors.getAddUsersFormErrors(state)
});

const mapDispatchToProps = {
  cancelAddUsersModal: Actions.cancelAddUsersModal,
  submitAddUsersModal: Actions.submitAddUsersModal,
  changeAddUsersForm: Actions.changeAddUsersForm
};

export default fullConnect(mapStateToProps, mapDispatchToProps)(AddUserModal);
