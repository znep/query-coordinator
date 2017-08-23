import { connect } from 'react-redux';
import _ from 'lodash';
import * as ApplyRevision from 'reduxStuff/actions/applyRevision';
import NotifyButton from 'components/NotifyButton/NotifyButton';

function mapStateToProps({ entities, ui }) {
  // _.find returns undefined if it doesn't find anything
  const inProgressTaskSet = _.find(
    entities.task_sets,
    taskSet =>
      taskSet.status !== ApplyRevision.TASK_SET_SUCCESSFUL &&
      taskSet.status !== ApplyRevision.TASK_SET_FAILURE
  );

  const apiCall = inProgressTaskSet ? _.find(ui.apiCalls, { id: inProgressTaskSet.job_uuid }) : null;

  return {
    taskSet: inProgressTaskSet,
    apiCall
  };
}

function mapDispatchToProps(dispatch) {
  return {
    addEmailInterest: jobUUID => {
      dispatch(ApplyRevision.addEmailInterest(jobUUID));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NotifyButton);
