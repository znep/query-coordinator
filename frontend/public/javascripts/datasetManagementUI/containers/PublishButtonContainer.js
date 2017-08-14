import _ from 'lodash';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import PublishButton from 'components/PublishButton/PublishButton';
import * as ApplyRevision from 'reduxStuff/actions/applyRevision';
import * as Selectors from 'selectors';
import { showModal } from 'reduxStuff/actions/modal';

function isDataSatisfied(state) {
  if (window.serverConfig.featureFlags.usaid_features_enabled) {
    return true;
  }
  let dataSatisfied;
  const outputSchema = Selectors.currentOutputSchema(state.entities);
  if (outputSchema) {
    const inputSchema = state.entities.input_schemas[outputSchema.input_schema_id];
    const columns = Selectors.columnsForOutputSchema(state.entities, outputSchema.id);
    dataSatisfied = Selectors.allTransformsDone(columns, inputSchema);
  } else {
    dataSatisfied = false;
  }
  return dataSatisfied;
}

function mapStateToProps(state, { params }) {
  const dataSatisfied = isDataSatisfied(state);
  const { fourfour } = params;
  const view = state.entities.views[fourfour];

  return {
    metadataSatisfied: view.datasetMetadataErrors.length === 0,
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
