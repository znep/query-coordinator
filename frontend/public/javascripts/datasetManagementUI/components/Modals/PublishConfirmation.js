import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { ModalContent, ModalFooter } from 'common/components';

import SocrataIcon from '../../../common/components/SocrataIcon';
import { hideModal } from 'actions/modal';
import { applyRevision, updateRevision } from 'actions/applyRevision';
import ApiCallButton from 'components/ApiCallButton';
import { APPLY_REVISION } from 'actions/apiCalls';
import * as Selectors from '../../selectors';
import styles from 'styles/Modals/PublishConfirmation.scss';
// <SocrataIcon className={styles.mainIcon} name="public-open" />

export const PublishConfirmation = ({ outputSchemaId, doCancel, doUpdate, setPermission, btnDisabled }) =>
  <div>
    <h2>{I18n.home_pane.publish_confirmation.title}</h2>
    <ModalContent>
      <p>{I18n.home_pane.publish_confirmation.body}</p>
      <button onClick={() => setPermission('public')}>public</button>
      <button onClick={() => setPermission('private')}>private</button>
    </ModalContent>
    <ModalFooter className={styles.modalFooter}>
      <button onClick={doCancel} className={styles.cancelButton}>
        {I18n.common.cancel}
      </button>
      <ApiCallButton
        additionalClassName={styles.mainButton}
        operation={APPLY_REVISION}
        forceDisable={btnDisabled}
        onClick={() => doUpdate(outputSchemaId)}>
        {I18n.home_pane.publish_confirmation.button}
      </ApiCallButton>
    </ModalFooter>
  </div>;

PublishConfirmation.propTypes = {
  outputSchemaId: PropTypes.number.isRequired,
  doCancel: PropTypes.func.isRequired,
  doUpdate: PropTypes.func.isRequired,
  btnDisabled: PropTypes.bool,
  setPermission: PropTypes.func
};

function mapStateToProps({ entities, ui }) {
  const outputSchemaId = Selectors.latestOutputSchema(entities).id;
  const { apiCalls } = ui;

  // Don't want to allow user to apply revision if our update to the revision
  // (making it private or public) is ongoing
  const revisionUpdatesInProgress = Object.keys(apiCalls).filter(
    callid =>
      apiCalls[callid].operation === 'UPDATE_REVISION' &&
      apiCalls[callid].status === 'STATUS_CALL_IN_PROGRESS'
  );

  return {
    outputSchemaId,
    btnDisabled: !!revisionUpdatesInProgress.length
  };
}

function mapDispatchToProps(dispatch) {
  return {
    doCancel: () => dispatch(hideModal()),
    doUpdate: outputSchemaId => dispatch(applyRevision(outputSchemaId)),
    setPermission: permission => dispatch(updateRevision(permission))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PublishConfirmation);
