import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styles from './edit-custom-role-modal.scss';
import includes from 'lodash/fp/includes';
import noop from 'lodash/fp/noop';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createNewRole, endRenameRole } from '../../actions';
import ConditionTransitionMotion from 'common/components/ConditionTransitionMotion';
import { spring } from 'react-motion';
import { RENAME_INDIVIDUAL_CUSTOM_ROLE, NEW_CUSTOM_ROLE } from '../../appStates';
import SocrataButton from 'common/components/SocrataButton';
import CustomRoleForm from './CustomRoleForm';
import { getAppState, getEditingRoleFromState, getMaxCharacterCountFromState } from '../../selectors';
import { connectLocalization } from 'common/components/Localization';

const mapStateToProps = state => {
  const appState = getAppState(state);
  const showModal = includes(appState, [NEW_CUSTOM_ROLE, RENAME_INDIVIDUAL_CUSTOM_ROLE]);
  const roleToEdit = getEditingRoleFromState(state);
  const maxCharacterCount = getMaxCharacterCountFromState(state);

  return {
    maxCharacterCount,
    showModal,
    roleToEdit,
    editingNewRole: appState === NEW_CUSTOM_ROLE
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      cancelCreateNewRole: createNewRole.cancel,
      saveRole: (maxCharacterCount, role) => endRenameRole({ maxCharacterCount, role }),
      createRole: () => createNewRole()
    },
    dispatch
  );

class EditCustomRoleModal extends Component {
  render() {
    const {
      cancelCreateNewRole,
      saveRole,
      createRole,
      editingNewRole,
      maxCharacterCount,
      roleToEdit,
      showModal,
      localization: { translate }
    } = this.props;
    const modalProps = {
      fullScreen: false,
      onDismiss: noop // don't allow clicking outside to hide
    };
    const headerProps = {
      showCloseButton: false,
      title: translate('screens.admin.roles.index_page.custom_role_modal.title'),
      onDismiss: () => {
        this.cancelModal();
      }
    };
    const onSubmit = () => (editingNewRole ? createRole() : saveRole(maxCharacterCount, roleToEdit));

    return (
      <ConditionTransitionMotion
        condition={showModal}
        willEnter={() => ({ y: -100, opacity: 0 })}
        willLeave={() => ({ y: spring(-100), opacity: spring(0) })}
        style={{ y: spring(0), opacity: spring(1) }}
      >
        {({ y, opacity }) =>
          <Modal
            {...modalProps}
            overlayStyle={{ opacity: opacity }}
            containerStyle={{ position: 'relative', top: `${y}px` }}
          >
            <ModalHeader {...headerProps} />

            <ModalContent>
              <CustomRoleForm onSubmit={onSubmit} />
            </ModalContent>

            <ModalFooter>
              <div>
                <SocrataButton
                  buttonType="primary"
                  buttonStyle="inverse"
                  onClick={() => cancelCreateNewRole()}
                >
                  {translate('screens.admin.roles.buttons.cancel')}
                </SocrataButton>
                <SocrataButton buttonType="primary" className={styles['save-button']} onClick={onSubmit}>
                  {translate(`screens.admin.roles.buttons.${editingNewRole ? 'create' : 'save'}`)}
                </SocrataButton>
              </div>
            </ModalFooter>
          </Modal>}
      </ConditionTransitionMotion>
    );
  }
}

EditCustomRoleModal.propTypes = {
  cancelCreateNewRole: PropTypes.func.isRequired,
  maxCharacterCount: PropTypes.number.isRequired,
  saveRole: PropTypes.func.isRequired,
  createRole: PropTypes.func.isRequired,
  editingNewRole: PropTypes.bool.isRequired,
  roleToEdit: PropTypes.object.isRequired,
  showModal: PropTypes.bool.isRequired
};

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(EditCustomRoleModal));
