import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';
import { LocalizedRolePicker } from '../../roles/components/RolePicker';
import connectLocalization from 'common/i18n/components/connectLocalization';
import has from 'lodash/has';
import isEmpty from 'lodash/isEmpty';
import { cancelAddUser, submitNewUsers } from '../actions';
import { getAddUserErrors } from '../../reducers';

export class AddUserModal extends Component {
  static propTypes = {
    errors: PropTypes.array,
    showModal: PropTypes.bool.isRequired,
    submittingUsers: PropTypes.bool
  };

  state = {
    selectedRoleId: '0'
  };

  componentDidUpdate() {
    const { showModal } = this.props;
    if (showModal) {
      this.textArea.focus();
    }
  }

  componentWillReceiveProps(nextProps) {
    // reset internal state when modal is going from hidden => visible
    if (this.props.showModal === false && nextProps.showModal === true) {
      this.setState({ selectedRoleId: undefined });
    }
  }

  cancelModal = () => {
    const { onCancelAddUser } = this.props;
    onCancelAddUser();
  };

  submitNewUsers = () => {
    const { onSubmitNewUsers } = this.props;
    const { selectedRoleId } = this.state;
    const emails = this.textArea.value;
    onSubmitNewUsers(emails, selectedRoleId);
  };

  renderError = (error, key) => {
    const { I18n } = this.props;
    if (has(error, 'translationKey')) {
      const translationKey = error.translationKey;
      const message = I18n.t(translationKey, error);
      if (translationKey.endsWith('_html')) {
        return <li dangerouslySetInnerHTML={{ __html: message }} key={key} />;
      } else {
        return <li key={key}>{message}</li>;
      }
    } else {
      return <li key={key}>{error}</li>;
    }
  };

  renderErrors = (errors) => {
    return (
      <div className="alert error">
        <ul className="error-list">{errors.map(this.renderError)}</ul>
      </div>
    );
  };

  render() {
    const { I18n, errors = [], showModal, submittingUsers } = this.props;
    const { selectedRoleId } = this.state;
    const hasError = !isEmpty(errors);
    const modalProps = {
      fullScreen: false,
      onDismiss: () => {}
    };
    const headerProps = {
      showCloseButton: true,
      title: I18n.translate('users.add_new_users.add_users'),
      onDismiss: () => {
        this.cancelModal();
      }
    };
    if (showModal) {
      return (
        <Modal {...modalProps}>
          <ModalHeader {...headerProps}>
            <div>{I18n.translate('users.add_new_users.subtitle')}</div>
          </ModalHeader>

          <ModalContent>
            <form className="add-user">
              <label className="block-label" htmlFor="add-user-emails">
                {I18n.translate('users.add_new_users.emails_label')}:
              </label>
              <textarea
                ref={ref => (this.textArea = ref)}
                className="add-user-emails text-input text-area"
                placeholder={I18n.translate('users.add_new_users.emails_placeholder')}
                id="add-user-emails"
              />
              <label className="block-label">{I18n.translate('users.add_new_users.role_label')}:</label>
              <LocalizedRolePicker
                roleId={selectedRoleId}
                onRoleChange={roleId => this.setState({ selectedRoleId: roleId })}
                placeholder={I18n.t('users.add_new_users.role_placeholder')}
              />
            </form>
            {hasError && this.renderErrors(errors)}
          </ModalContent>

          <ModalFooter>
            <div>
              <button
                type="button"
                className="btn btn-secondary add-user-cancel"
                onClick={this.cancelModal}
                disabled={submittingUsers}>
                {I18n.translate('users.add_new_users.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary add-user-confirm"
                onClick={this.submitNewUsers}
                disabled={submittingUsers}>
                {I18n.translate('users.add_new_users.add_users')}
              </button>
            </div>
          </ModalFooter>
        </Modal>
      );
    } else {
      return null;
    }
  }
}

const mapStateToProps = state => ({
  showModal: state.ui.showAddUserUi,
  errors: getAddUserErrors(state),
  submittingUsers: state.ui.submittingUsers
});

const mapDispatchToProps = ({
  onCancelAddUser: cancelAddUser,
  onSubmitNewUsers:  submitNewUsers
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(AddUserModal));
