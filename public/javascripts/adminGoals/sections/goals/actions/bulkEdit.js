import _ from 'lodash';
import * as api from '../../../api';
import * as SharedActions from '../../shared/actions';
import * as DataActions from './data';
import * as Helpers from '../../../helpers';

export const types = {
  openModal: 'goals.bulkEdit.openModal',
  closeModal: 'goals.bulkEdit.closeModal',
  setFormData: 'goals.bulkEdit.setFormData'
};

export const openModal = () => ({
  type: types.openModal
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
  const translations = getState().get('translations');

  // Cannot update prevailing measure data for the items
  // which are not configured properly.
  if (!allConfigured) {
    const message = Helpers.translator(translations, 'admin.bulk_edit.not_configured_message');
    dispatch(SharedActions.showModalMessage('goals', 'bulkEdit', message));

    return Promise.resolve();
  }

  const failureMessage = Helpers.translator(translations, 'admin.bulk_edit.failure_message');

  const normalizedData = formatGoalDataForWrite(updatedData);
  dispatch(SharedActions.setModalInProgress('goals', 'bulkEdit', true));

  const updateRequests = goals.map(goal => api.goals.update(goal.get('id'), goal.get('version'), normalizedData));
  return Promise.all(updateRequests).then(updatedGoals => {
    const successMessage = Helpers.translator(translations, 'admin.bulk_edit.success_message', updatedGoals.length);

    dispatch(DataActions.updateAll(updatedGoals));
    dispatch(closeModal());
    dispatch(SharedActions.showGlobalMessage('goals', successMessage, 'success'));

    return updatedGoals;
  }).catch(() => dispatch(SharedActions.showModalMessage('goals', 'bulkEdit', failureMessage))); // eslint-disable-line dot-notation
};
