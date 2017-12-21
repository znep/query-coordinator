import _ from 'lodash';
import { connect } from 'react-redux';
import PublishButton from 'components/PublishButton/PublishButton';
import * as ApplyRevision from 'reduxStuff/actions/applyRevision';
import * as Selectors from 'selectors';
import { showModal } from 'reduxStuff/actions/modal';
import { hasDatasetErrors } from 'containers/ManageMetadataContainer';
import { withRouter } from 'react-router';

function isDataSatisfied({ entities, ui }, params) {
  const isUSAID = window.serverConfig.featureFlags.usaid_features_enabled;
  const isPublishedDataset = entities.views[params.fourfour].displayType !== 'draft';
  const rev = Selectors.currentRevision(entities, _.toNumber(params.revisionSeq));
  const isValidHrefDataset =
    rev.output_schema_id == null && !!rev.href.length && !ui.forms.hrefForm.errors.length;

  if (isUSAID || isPublishedDataset || isValidHrefDataset) {
    return true;
  }

  let dataSatisfied;
  const revisionSeq = _.toNumber(params.revisionSeq);
  const outputSchema = Selectors.currentOutputSchema(entities, revisionSeq);
  const blob = Selectors.currentBlobSource(entities, revisionSeq);
  if (outputSchema) {
    dataSatisfied = !!outputSchema.finished_at;
  } else if (blob) {
    dataSatisfied = !!blob.finished_at;
  } else {
    dataSatisfied = false;
  }
  return dataSatisfied;
}

// do not allow publishing of is_parent: false revisions w/o an external link (pointing to a parent) on USAID
function isParenthoodSatisfied(rev, isUSAID) {
  if (isUSAID && rev.is_parent === false) {
    return (
      !!rev.metadata.metadata.additionalAccessPoints &&
      rev.metadata.metadata.additionalAccessPoints.length > 0
    );
  } else {
    return true;
  }
}

function isPublishing(taskSets) {
  return !!_.chain(taskSets)
    .filter(set => set.status === ApplyRevision.TASK_SET_IN_PROGRESS)
    .size()
    .value();
}

export function mapStateToProps(state, { params }) {
  const rev = Selectors.currentRevision(state.entities, _.toNumber(params.revisionSeq));
  const isUSAID = window.serverConfig.featureFlags.usaid_features_enabled;

  const dataSatisfied = isDataSatisfied(state, params);
  const publishing = isPublishing(state.entities.task_sets);
  const parenthoodSatisfied = isParenthoodSatisfied(rev, isUSAID);
  return {
    metadataSatisfied: !hasDatasetErrors(state.ui.forms.datasetForm.errors),
    dataSatisfied,
    parenthoodSatisfied,
    publishing,
    requiresParenthood: isUSAID && rev.is_parent === false
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
