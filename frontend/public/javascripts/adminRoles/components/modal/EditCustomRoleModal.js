import includes from 'lodash/fp/includes';
import noop from 'lodash/fp/noop';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { spring } from 'react-motion';
import { connect } from 'react-redux';

import Button from 'common/components/Button';
import ConditionTransitionMotion from 'common/components/ConditionTransitionMotion';
import { connectLocalization } from 'common/components/Localization';
import { Modal, ModalContent, ModalFooter, ModalHeader } from 'common/components/Modal';

import * as Actions from '../../actions';
import * as Selectors from '../../adminRolesSelectors';
import { NEW_CUSTOM_ROLE, RENAME_INDIVIDUAL_CUSTOM_ROLE } from '../../appStates';
import CustomRoleForm from './CustomRoleForm';
import styles from './edit-custom-role-modal.module.scss';

const mapStateToProps = state => {
  const appState = Selectors.getAppState(state);
  const showModal = includes(appState, [NEW_CUSTOM_ROLE, RENAME_INDIVIDUAL_CUSTOM_ROLE]);

  return {
    showModal,
    editingNewRole: appState === NEW_CUSTOM_ROLE
  };
};

const mapDispatchToProps = {
  cancelCreateNewRole: Actions.createNewRoleCancel,
  saveRole: Actions.renameRoleEnd,
  createRole: Actions.createNewRoleStart
};

class EditCustomRoleModal extends Component {
  render() {
    const {
      cancelCreateNewRole,
      saveRole,
      createRole,
      editingNewRole,
      showModal,
      localization: { translate }
    } = this.props;
    const modalProps = {
      fullScreen: false,
      onDismiss: noop // don't allow clicking outside to hide
    };
    const headerProps = {
      showCloseButton: false,
      title: translate(
        editingNewRole
          ? 'screens.admin.roles.index_page.custom_role_modal.title'
          : 'screens.admin.roles.index_page.custom_role_modal.rename_title'
      ),
      onDismiss: noop
    };
    const onSubmit = () => (editingNewRole ? createRole() : saveRole()); // TODO: EN-22314 - Move this logic to sagas

    return (
      <ConditionTransitionMotion
        condition={showModal}
        willEnter={() => ({ y: -100, opacity: 0 })}
        willLeave={() => ({ y: spring(-100), opacity: spring(0) })}
        style={{ y: spring(0), opacity: spring(1) }}
      >
        {({ y, opacity }) => (
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
                <Button variant="primary" inverse onClick={cancelCreateNewRole}>
                  {translate('screens.admin.roles.buttons.cancel')}
                </Button>
                <Button variant="primary" className={styles['save-button']} onClick={onSubmit}>
                  {translate(`screens.admin.roles.buttons.${editingNewRole ? 'create' : 'save'}`)}
                </Button>
              </div>
            </ModalFooter>
          </Modal>
        )}
      </ConditionTransitionMotion>
    );
  }
}

EditCustomRoleModal.propTypes = {
  cancelCreateNewRole: PropTypes.func.isRequired,
  saveRole: PropTypes.func.isRequired,
  createRole: PropTypes.func.isRequired,
  editingNewRole: PropTypes.bool.isRequired,
  showModal: PropTypes.bool.isRequired
};

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(EditCustomRoleModal));
