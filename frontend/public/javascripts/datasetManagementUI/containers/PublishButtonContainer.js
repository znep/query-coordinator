import _ from 'lodash';
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
    const columns = Selectors.columnsForOutputSchema(state.entities, outputSchema.id);
    dataSatisfied = Selectors.allTransformsDone(columns);
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

export default connect(mapStateToProps, mapDispatchToProps)(PublishButton);
