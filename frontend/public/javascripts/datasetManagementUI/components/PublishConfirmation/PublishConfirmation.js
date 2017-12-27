import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ModalContent, ModalFooter } from 'common/components';
import SocrataIcon from '../../../common/components/SocrataIcon';
import ApiCallButton from 'containers/ApiCallButtonContainer';
import { APPLY_REVISION } from 'reduxStuff/actions/apiCalls';
import styles from './PublishConfirmation.module.scss';

class PublishConfirmation extends Component {
  constructor(props) {
    super();
    this.state = {
      currentPermission: props.publicSelected ? 'public' : 'private'
    };
    this.setCurrentPermission = this.setCurrentPermission.bind(this);
  }
  setCurrentPermission(permission) {
    this.setState({ currentPermission: permission });
  }
  render() {
    const {
      doCancel, dispatchApplyRevision, setPermission, btnDisabled, dispatchRevisionError
    } = this.props;
    const { currentPermission } = this.state;
    return (
      <div className="publish-confirmation-modal-inner">
        <h2>
          {I18n.home_pane.publish_confirmation.title}
        </h2>
        <ModalContent>
          <span
            onClick={() => this.setCurrentPermission('public')}
            className={
              currentPermission === 'public' ? styles.privacySelectorActive : styles.privacySelector
            }>
            <SocrataIcon name="checkmark3" className={styles.checkbox} />
            <h3>
              {I18n.home_pane.publish_confirmation.public}
            </h3>
            <SocrataIcon className={styles.icon} name="public-open" />
            {I18n.home_pane.publish_confirmation.public_msg}
          </span>
          <span
            onClick={() => this.setCurrentPermission('private')}
            className={
              currentPermission === 'private' ? styles.privacySelectorActive : styles.privacySelector
            }>
            <SocrataIcon name="checkmark3" className={styles.checkbox} />
            <h3>
              {I18n.home_pane.publish_confirmation.private}
            </h3>
            <SocrataIcon className={styles.icon} name="private" />
            {I18n.home_pane.publish_confirmation.private_msg}
          </span>
        </ModalContent>
        <ModalFooter className={styles.modalFooter}>
          <button onClick={() => doCancel()} className={styles.cancelButton}>
            {I18n.common.cancel}
          </button>
          <ApiCallButton
            additionalClassName={styles.mainButton}
            operation={APPLY_REVISION}
            forceDisable={btnDisabled}
            onClick={() => {
              const setPermissionPromise = setPermission(currentPermission);
              // if there is no promise, it is because the permission never changed
              if (setPermissionPromise) {
                setPermissionPromise
                .then(() => dispatchApplyRevision())
                .catch(() => dispatchRevisionError());
              } else {
                dispatchApplyRevision();
              }
            }}>
              {I18n.home_pane.publish_confirmation.button}
          </ApiCallButton>
        </ModalFooter>
      </div>
    );
  }
}

PublishConfirmation.propTypes = {
  doCancel: PropTypes.func.isRequired,
  dispatchApplyRevision: PropTypes.func.isRequired,
  btnDisabled: PropTypes.bool,
  setPermission: PropTypes.func,
  publicSelected: PropTypes.bool.isRequired,
  dispatchRevisionError: PropTypes.func
};

export default PublishConfirmation;
