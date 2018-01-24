import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Publishing from 'datasetManagementUI/components/Publishing/Publishing';
import * as Selectors from 'datasetManagementUI/selectors';
import { hideModal } from 'datasetManagementUI/reduxStuff/actions/modal';
import * as ApplyRevision from 'datasetManagementUI/reduxStuff/actions/applyRevision';

export function mapStateToProps({ entities }, { params }) {
  const revision = _.values(entities.revisions)[0];
  const taskSet = _.maxBy(_.values(entities.task_sets), job => job.updated_at);
  const { fourfour } = params;
  const rowsToBeUpserted = taskSet.output_schema_id
    ? Selectors.rowsToBeImported(entities, taskSet.output_schema_id)
    : null;

  return {
    revision,
    taskSet,
    fourfour,
    rowsToBeUpserted
  };
}

function mapDispatchToProps(dispatch) {
  return {
    applyRevision: params => dispatch(ApplyRevision.applyRevision(params)),
    onCancelClick: () => dispatch(hideModal())
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Publishing));
