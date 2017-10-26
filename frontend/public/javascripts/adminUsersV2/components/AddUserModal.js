import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';
import { LocalizedRolePicker } from './RolePicker';
import connectLocalization from 'common/i18n/components/connectLocalization';
import _ from 'lodash';

export class AddUserModal extends Component {
  constructor() {
    super();
    this.state = {
      selectedRoleId: '0'
    };
    _.bindAll(this, ['cancelModal', 'renderError', 'renderErrors', 'submitNewUsers']);
  }

  componentDidUpdate() {
    const { showModal } = this.props;
    if (showModal) {
      this.textArea.focus();
    }
  }

  cancelModal() {
    const { onCancelAddUser } = this.props;
    this.setState({ selectedRoleId: undefined });
    onCancelAddUser();
  }

  submitNewUsers() {
    const { onSubmitNewUsers } = this.props;
    const { selectedRoleId } = this.state;
    const emails = this.textArea.value;
    onSubmitNewUsers(emails, selectedRoleId);
  }

  renderError(error, key) {
    const { I18n } = this.props;
    if (_.has(error, 'translationKey')) {
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
  }

  renderErrors(errors) {
    return (
      <div className="alert error">
        <ul className="error-list">{errors.map(this.renderError)}</ul>
      </div>
    );
  }

  render() {
    const { I18n, errors = [], showModal } = this.props;
    const { selectedRoleId } = this.state;
    const hasError = !_.isEmpty(errors);
    const modalProps = {
      fullScreen: false,
      onDismiss: _.noop // don't allow clicking outside to hide
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
            <div>
              {I18n.translate('users.add_new_users.subtitle')}
            </div>
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
                id="add-user-emails" />
              <label className="block-label" >
                {I18n.translate('users.add_new_users.role_label')}:
              </label>
              <LocalizedRolePicker
                roleId={selectedRoleId}
                onRoleChange={roleId => this.setState({ selectedRoleId: roleId })}
                placeholder={I18n.t('users.add_new_users.role_placeholder')} />
            </form>
            {hasError && this.renderErrors(errors)}
          </ModalContent>

          <ModalFooter>
            <div>
              <button type="button" className="btn btn-secondary add-user-cancel" onClick={this.cancelModal}>
                {I18n.translate('users.add_new_users.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary add-user-confirm"
                onClick={this.submitNewUsers}>
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

AddUserModal.propTypes = {
  errors: PropTypes.array,
  showModal: PropTypes.bool.isRequired
};

const mapStateToProps = state => {
  const errors = _.get(state, 'ui.addUserErrors', []);
  return {
    showModal: state.ui.showAddUserUi,
    errors
  };
};

const mapDispatchToProps = _.partial(
  bindActionCreators,
  {
    onCancelAddUser: () => Actions.cancelAddUser(),
    onSubmitNewUsers: (emails, roleId) => Actions.submitNewUsers(emails, roleId)
  },
  _
);

const ConnectedAddUserModal = connectLocalization(connect(mapStateToProps, mapDispatchToProps)(AddUserModal));
export default ConnectedAddUserModal;
