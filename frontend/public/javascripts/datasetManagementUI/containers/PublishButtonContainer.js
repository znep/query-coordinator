import _ from 'lodash';
import { connect } from 'react-redux';
import PublishButton from 'components/PublishButton/PublishButton';
import * as ApplyRevision from 'reduxStuff/actions/applyRevision';
import * as Selectors from 'selectors';
import { showModal } from 'reduxStuff/actions/modal';
import { withRouter } from 'react-router';

function isDataSatisfied({ entities }, params) {
  const isUSAID = window.serverConfig.featureFlags.usaid_features_enabled;
  const isPublishedDataset = entities.views[params.fourfour].displayType !== 'draft';

  if (isUSAID || isPublishedDataset) {
    return true;
  }
  let dataSatisfied;
  const revisionSeq = _.toNumber(params.revisionSeq);
  const outputSchema = Selectors.currentOutputSchema(entities, revisionSeq);
  if (outputSchema) {
    const columns = Selectors.columnsForOutputSchema(entities, outputSchema.id);
    dataSatisfied = Selectors.allTransformsDone(columns);
  } else {
    dataSatisfied = false;
  }
  return dataSatisfied;
}

function isPublishing(taskSets) {
  return !!_.chain(taskSets)
    .filter(set => set.status === ApplyRevision.TASK_SET_IN_PROGRESS)
    .size()
    .value();
}

export function mapStateToProps(state, { params }) {
  const dataSatisfied = isDataSatisfied(state, params);
  const publishing = isPublishing(state.entities.task_sets);

  return {
    metadataSatisfied: state.ui.forms.datasetForm.errors.length === 0,
    dataSatisfied,
    publishing
  };
}

function mapDispatchToProps(dispatch) {
  return {
    publishDataset: modalName => {
      dispatch(showModal(modalName));
    }
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PublishButton));
