import includes from 'lodash/fp/includes';
import noop from 'lodash/fp/noop';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { spring } from 'react-motion';

import Button from 'common/components/Button';
import ConditionTransitionMotion from 'common/components/ConditionTransitionMotion';
import { customConnect, I18nPropType } from 'common/connectUtils';
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
  onCancel: Actions.editCustomRoleModalCancel,
  onSubmit: Actions.editCustomRoleModalSubmit
};

class EditCustomRoleModal extends Component {
  static propTypes = {
    I18n: I18nPropType,
    onCancel: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    editingNewRole: PropTypes.bool.isRequired,
    showModal: PropTypes.bool.isRequired
  };

  render() {
    const {
      I18n,
      onCancel,
      onSubmit,
      editingNewRole,
      showModal
    } = this.props;
    const modalProps = {
      fullScreen: false,
      onDismiss: noop // don't allow clicking outside to hide
    };
    const headerProps = {
      showCloseButton: false,
      title: I18n.t(
        editingNewRole
          ? 'screens.admin.roles.index_page.custom_role_modal.title'
          : 'screens.admin.roles.index_page.custom_role_modal.rename_title'
      ),
      onDismiss: noop
    };

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
                <Button variant="primary" inverse onClick={onCancel}>
                  {I18n.t('screens.admin.roles.buttons.cancel')}
                </Button>
                <Button variant="primary" className={styles['save-button']} onClick={onSubmit}>
                  {I18n.t(`screens.admin.roles.buttons.${editingNewRole ? 'create' : 'save'}`)}
                </Button>
              </div>
            </ModalFooter>
          </Modal>
        )}
      </ConditionTransitionMotion>
    );
  }
}

export default customConnect({ mapStateToProps, mapDispatchToProps })(EditCustomRoleModal);
