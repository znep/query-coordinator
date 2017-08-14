import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { hideModal } from 'actions/modal';
import { applyRevision, updateRevision } from 'actions/applyRevision';
import * as Selectors from 'selectors';
import PublishConfirmationUSAID from 'components/PublishConfirmationUSAID/PublishConfirmationUSAID';

export function mapStateToProps({ entities, ui }) {
  const latestOutputSchema = Selectors.currentOutputSchema(entities);
  const outputSchemaId = latestOutputSchema ? latestOutputSchema.id : null;
  const { id: revisionId } = Selectors.latestRevision(entities);
  const permission = entities.revisions[revisionId] ? entities.revisions[revisionId].permission : 'public';
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
    btnDisabled: !!revisionUpdatesInProgress.length,
    publicSelected: permission === 'public'
  };
}

function mapDispatchToProps(dispatch) {
  return {
    doCancel: initialPermission => {
      dispatch(updateRevision(initialPermission));
      dispatch(hideModal());
    },
    dispatchApplyRevision: params => dispatch(applyRevision(params)),
    setPermission: permission => dispatch(updateRevision(permission))
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PublishConfirmationUSAID));
