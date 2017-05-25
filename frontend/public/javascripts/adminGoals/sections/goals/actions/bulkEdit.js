import _ from 'lodash';
import * as api from '../../../api';
import * as DataActions from './data';
import * as Analytics from '../../shared/analytics';
import Airbrake from 'common/airbrake';

export const types = {
  openModal: 'goals.bulkEdit.openModal',
  closeModal: 'goals.bulkEdit.closeModal',
  setFormData: 'goals.bulkEdit.setFormData',
  setPublishingAction: 'goals.bulkEdit.setPublishingAction',
  // Save started.
  // Payload: number of goals to save..
  saveStart: 'goals.bulkEdit.saveStart',

  // One save task completed successfully.
  // Payload: none.
  saveProgressSuccess: 'goals.bulkEdit.saveProgressSuccess',

  // One save task completed with error.
  // Payload: goal which failed to save. Optional.
  saveProgressError: 'goals.bulkEdit.saveProgressError',

  // Overall save process completed, regardless
  // of success or failure.
  // Payload: none.
  saveFinished: 'goals.bulkEdit.saveFinished'
};

export const openModal = () => ({
  type: types.openModal,
  ...Analytics.createTrackEventActionData(Analytics.EventNames.bulkEditGoal, {})
});

export const closeModal = () => ({
  type: types.closeModal
});

export const setPublishingAction = (publishingAction) => ({
  type: types.setPublishingAction,
  data: publishingAction
});

export const setFormData = (path, value) => ({
  type: types.setFormData,
  data: { path, value }
});

export const saveStart = (taskTotalCount) => ({
  data: taskTotalCount,
  type: types.saveStart,
  ...Analytics.createTrackEventActionData(Analytics.EventNames.clickUpdateOnBulkEdit, {})
});
export const saveProgressSuccess = () => ({ type: types.saveProgressSuccess });
export const saveProgressError = (goal) => ({ type: types.saveProgressError, data: goal});
export const saveFinished = () => ({ type: types.saveFinished });

/**
 * Goal update api expects prevailing_measure data normalized.
 * @param {Object} updatedData
 */
function formatGoalDataForWrite(updatedData) {
  let normalized = _.merge(updatedData, updatedData.prevailing_measure || {});
  delete normalized.prevailing_measure;

  if (normalized.metadata) {
    normalized.override = normalized.metadata.progress_override;
    delete normalized.metadata;
  }

  return normalized;
}

// Saves one goal in the broader context of a bulk edit.
// Returns a promise for the latest version of the goal.
const saveSingleGoal = (goal, dataToWrite, publishingAction) => {
  const { id, version } = goal;
  if (publishingAction === 'make_private') {
    dataToWrite.is_public = false;
  } else if (publishingAction === 'make_public_classic_editor') {
    dataToWrite.is_public = true;
  }

  const updateConfigurationRequest = api.goals.update(
    id,
    version,
    dataToWrite
  );

  return updateConfigurationRequest.then((updateResult) => {
    if (publishingAction === 'publish_latest_draft') {
      // Note that we're only publishing _after_ we know the rest of the data
      // was updated successfully. Otherwise, we might publish a partially-
      // updated goal if another request fails!

      // This API call will set is_public to true and also
      // returns a promise for the latest version of the goal.
      return api.goals.publishLatestDraft(id).then((updatedGoal) => {
        const latestDraft = _.get(goal, 'narrative.draft', null);
        return {
          narrative: {
            published: latestDraft,
            draft: latestDraft
          },
          ...updatedGoal
        };
      });
    } else {
      // Just return the latest version of the goal,
      // but preserve the draft information.
      updateResult.narrative = updateResult.narrative || goal.narrative;
      return updateResult;
    }
  });
};

/**
 * Makes an API request to update given list of goals
 * data. The returned promise resolves to true if the
 * request has succeeded, false otherwise.
 *
 * @param {Array} goals List of goal objects
 * @param {Object} updatedData Updated fields
 */
export const saveGoals = (goals, updatedData) => (dispatch, getState) => {
  const allConfigured = _.every(goals, (goal) => _.has(goal, 'prevailing_measure'));
  const bulkEdit = getState().getIn(['goals', 'bulkEdit']);
  const publishingAction = bulkEdit.get('publishingAction');

  // Cannot update prevailing measure data for the items
  // which are not configured properly.
  // The UI should prevent this case.
  if (!allConfigured) {
    throw new Error('Cannot save goal which has not been configured.');
  }

  const normalizedData = formatGoalDataForWrite(updatedData);
  dispatch(saveStart(goals.length));

  const updateRequests = _.map(goals, (goal) => {
    return saveSingleGoal(goal, normalizedData, publishingAction).then(
      (updatedGoalData) => {
        dispatch(DataActions.updateById(goal.id, updatedGoalData));
        dispatch(saveProgressSuccess());
        return updatedGoalData;
      },
      (error) => {
        dispatch(saveProgressError(goal));
        Airbrake.notify(error);
      }
    );
  });

  // Note that Promise.all fails fast, so it's important that we
  // handle errors in each individual updateRequests promises.
  // Otherwise, we'll end up reporting only the first failure below.
  return Promise.all(updateRequests).then(updatedGoals => {
    dispatch(saveFinished());
    return updatedGoals;
  }).catch((error) => {
    // Since we catch() in the individual requests, we are unlikely to get here.
    // If we do get here, there's probably a TypeError or similar lurking in our
    // codebase.
    dispatch(saveProgressError());
    dispatch(saveFinished());
    Airbrake.notify(error);
  }).then(() =>
    // Return success or failure.
    !getState().getIn(['goals', 'bulkEdit', 'saveStatus', 'error'])
  );
};
