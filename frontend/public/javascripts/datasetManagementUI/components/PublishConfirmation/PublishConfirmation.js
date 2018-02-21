import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ModalContent, ModalFooter } from 'common/components';
import * as assetUtils from 'common/asset/utils';
import SocrataIcon from '../../../common/components/SocrataIcon';
import ApiCallButton from 'datasetManagementUI/containers/ApiCallButtonContainer';
import { APPLY_REVISION } from 'datasetManagementUI/reduxStuff/actions/apiCalls';
import styles from './PublishConfirmation.module.scss';

export const PERMISSIONS = {
  PUBLIC: 'public',
  PRIVATE: 'private'
};

class PublishConfirmation extends Component {
  constructor(props) {
    super();

    this.state = {
      currentPermission: props.permission,
      showApprovalMessage: false
    };

    this.setCurrentPermission = this.setCurrentPermission.bind(this);
  }

  // Right now we don't update the revision in the store when you toggle the
  // permission here. When/if we separate "change permission" and "publish" into
  // two steps, we need to at least update the redux store on permission toggle.
  // Ideally "change permission" would call to dsmapi, then we would take the
  // response and update the store.
  setCurrentPermission(permission) {
    this.setState({ currentPermission: permission });
  }

  render() {
    const { doCancel, doUpdateAndApply, view } = this.props;

    const { currentPermission } = this.state;

    const assetWillBePublic = currentPermission === PERMISSIONS.PUBLIC;

    assetUtils
      .assetWillEnterApprovalsQueueOnPublish({ coreView: view, assetWillBePublic })
      .then(showApprovalMessage => {
        if (showApprovalMessage !== this.state.showApprovalMessage) {
          this.setState({ showApprovalMessage });
        }
      });

    return (
      <div className="publish-confirmation-modal-inner">
        <h2>{I18n.home_pane.publish_confirmation.title}</h2>
        <ModalContent>
          <span
            onClick={() => this.setCurrentPermission(PERMISSIONS.PUBLIC)}
            className={
              currentPermission === PERMISSIONS.PUBLIC ? styles.privacySelectorActive : styles.privacySelector
            }>
            <SocrataIcon name="checkmark3" className={styles.checkbox} />
            <h3>{I18n.home_pane.publish_confirmation.public}</h3>
            <SocrataIcon className={styles.icon} name="public-open" />
            {I18n.home_pane.publish_confirmation.public_msg}
          </span>
          <span
            onClick={() => this.setCurrentPermission(PERMISSIONS.PRIVATE)}
            className={
              currentPermission === PERMISSIONS.PRIVATE
                ? styles.privacySelectorActive
                : styles.privacySelector
            }>
            <SocrataIcon name="checkmark3" className={styles.checkbox} />
            <h3>{I18n.home_pane.publish_confirmation.private}</h3>
            <SocrataIcon className={styles.icon} name="private" />
            {I18n.home_pane.publish_confirmation.private_msg}
          </span>
          {this.state.showApprovalMessage && (
            <div className={styles.approvalMessage}>{I18n.home_pane.publish_confirmation.approval_note}</div>
          )}
        </ModalContent>
        <ModalFooter className={styles.modalFooter}>
          <button onClick={doCancel} className={styles.cancelButton}>
            {I18n.common.cancel}
          </button>
          <ApiCallButton
            additionalClassName={styles.mainButton}
            operation={APPLY_REVISION}
            onClick={() => doUpdateAndApply(currentPermission)}>
            {I18n.home_pane.publish_confirmation.button}
          </ApiCallButton>
        </ModalFooter>
      </div>
    );
  }
}

PublishConfirmation.propTypes = {
  doCancel: PropTypes.func.isRequired,
  doUpdateAndApply: PropTypes.func.isRequired,
  permission: PropTypes.string.isRequired,
  view: PropTypes.object
};

export default PublishConfirmation;
