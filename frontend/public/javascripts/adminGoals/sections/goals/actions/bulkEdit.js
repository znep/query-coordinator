import _ from 'lodash';
import * as api from '../../../api';
import * as SharedActions from '../../shared/actions';
import * as DataActions from './data';
import * as Helpers from '../../../helpers';
import * as Analytics from '../../shared/analytics';

export const types = {
  openModal: 'goals.bulkEdit.openModal',
  closeModal: 'goals.bulkEdit.closeModal',
  setFormData: 'goals.bulkEdit.setFormData',
  saveStart: 'goals.bulkEdit.saveStart', // Payload: none.
  saveSuccess: 'goals.bulkEdit.saveSuccess', // Payload: Number of goals saved.
  saveError: 'goals.bulkEdit.saveError' // Payload: none.
};

export const openModal = () => ({
  type: types.openModal,
  ...Analytics.createTrackEventActionData(Analytics.EventNames.bulkEditGoal, {})
});

export const closeModal = () => ({
  type: types.closeModal
});

export const setFormData = data => ({
  type: types.setFormData,
  data
});

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

/**
 * Makes an API request to update given list of goals
 * data.
 *
 * @param {Immutable.List} goals List of goal objects
 * @param {Object} updatedData Updated fields
 */
export const saveGoals = (goals, updatedData) => (dispatch, getState) => {
  const allConfigured = goals.every(goal => goal.has('prevailing_measure'));

  // Send event to mixpanel
  const analyticsEvent = Analytics.createTrackEventActionData(Analytics.EventNames.clickUpdateOnBulkEdit, {});
  dispatch(SharedActions.doSideEffect(analyticsEvent));

  // Cannot update prevailing measure data for the items
  // which are not configured properly.
  // The UI should prevent this case.
  if (!allConfigured) {
    throw new Error('Cannot save goal which has not been configured.');
  }

  const normalizedData = formatGoalDataForWrite(updatedData);
  dispatch({ type: types.saveStart });

  const updateRequests = goals.map(goal => api.goals.update(goal.get('id'), goal.get('version'), normalizedData));
  return Promise.all(updateRequests).then(updatedGoals => {

    // TODO: Consider combining these actions. They're redundant.
    dispatch(DataActions.updateAll(updatedGoals));
    dispatch({
      type: types.saveSuccess,
      data: updatedGoals.length
    });
    dispatch(closeModal()); // TODO does this really belong here?

    return updatedGoals;
  }).catch(() => dispatch({
    type: types.saveError
  }));
};
