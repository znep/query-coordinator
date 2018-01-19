import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { hideModal } from 'datasetManagementUI/reduxStuff/actions/modal';
import { applyRevision, updatePermission } from 'datasetManagementUI/reduxStuff/actions/applyRevision';
import PublishConfirmation from 'datasetManagementUI/components/PublishConfirmation/PublishConfirmation';
import { addNotification } from 'datasetManagementUI/reduxStuff/actions/notifications';

export function mapStateToProps({ entities, ui }, { params }) {
  const rev = _.values(entities.revisions).find(r => r.revision_seq === _.toNumber(params.revisionSeq));
  const { id: revisionId } = rev;
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
    btnDisabled: !!revisionUpdatesInProgress.length,
    publicSelected: permission === 'public'
  };
}

function mapDispatchToProps(dispatch, { params }) {
  return {
    doCancel: () => dispatch(hideModal()),
    dispatchApplyRevision: () => dispatch(applyRevision(params)),
    setPermission: permission => dispatch(updatePermission(permission, params)),
    dispatchRevisionError: () => {
      dispatch(addNotification('error', I18n.notifications.dataset_revision_error));
    }
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PublishConfirmation));
