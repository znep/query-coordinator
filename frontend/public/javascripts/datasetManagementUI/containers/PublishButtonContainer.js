import _ from 'lodash';
import { connect } from 'react-redux';
import PublishButton from 'components/PublishButton/PublishButton';
import * as ApplyRevision from 'reduxStuff/actions/applyRevision';
import * as Selectors from 'selectors';
import { showModal } from 'reduxStuff/actions/modal';
import { withRouter } from 'react-router';

function isDataSatisfied({ entities }, { params }) {
  if (window.serverConfig.featureFlags.usaid_features_enabled) {
    return true;
  }
  let dataSatisfied;
  const revisionSeq = _.toNumber(params.revisionSeq);
  const outputSchema = Selectors.currentOutputSchema(entities, revisionSeq);
  if (outputSchema) {
    // TODO: delete old stuff once dsmapi websocket change goes in
    const inputSchema = entities.input_schemas[outputSchema.input_schema_id];

    const columns = Selectors.columnsForOutputSchema(entities, outputSchema.id);
    dataSatisfied =
      Selectors.allTransformsDone(columns) || Selectors.allTransformsDoneOld(columns, inputSchema);
  } else {
    dataSatisfied = false;
  }
  return dataSatisfied;
}

function mapStateToProps(state) {
  const dataSatisfied = isDataSatisfied(state);

  return {
    metadataSatisfied: state.ui.forms.datasetForm.errors.length === 0,
    dataSatisfied,
    publishedOrPublishing:
      _.size(
        _.filter(
          state.entities.task_sets,
          set =>
            set.status === ApplyRevision.TASK_SET_SUCCESSFUL ||
            set.status === ApplyRevision.TASK_SET_IN_PROGRESS
        )
      ) > 0
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
