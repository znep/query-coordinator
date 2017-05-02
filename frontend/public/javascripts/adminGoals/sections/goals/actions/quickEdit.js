import * as Api from '../../../api';
import * as DataActions from './data';
import * as Helpers from '../../../helpers';
import * as State from '../state';
import * as Selectors from '../selectors';
import * as Analytics from '../../shared/analytics';

export const types = {
  openModal: 'goals.quickEdit.openModal',
  closeModal: 'goals.quickEdit.closeModal',
  updateFormData: 'goals.quickEdit.updateFormData',
  saveStart: 'goals.quickEdit.saveStart', // Payload: none (includes analytics event).
  saveSuccess: 'goals.quickEdit.saveSuccess', // Payload: none.
  saveError: 'goals.quickEdit.saveError', // Payload: Error JSON.
  publishLatestDraft: 'goals.quickEdit.publishLatestDraft' // Payload: none.
};

export const openModal = goalId => ({
  type: types.openModal,
  goalId,
  ...Analytics.createTrackEventActionData(Analytics.EventNames.quickEditGoal, {
    [Analytics.EventPayloadKeys.goalId]: goalId
  })
});

export const closeModal = () => ({
  type: types.closeModal
});

export const updateFormData = data => ({
  type: types.updateFormData,
  data
});

export const saveStart = (goalId, analyticsEvent) => ({
  type: types.saveStart,
  ...Analytics.createTrackEventActionData(analyticsEvent, {
      [Analytics.EventPayloadKeys.goalId]: goalId
  })
});
export const saveError = (error) => ({ type: types.saveError, data: error });
export const saveSuccess = () => ({ type: types.saveSuccess });

/**
 * Publishes latest narrative draft.
 */
export const publishLatestDraft = () => {
  return (dispatch, getState) => {
    const state = getState();
    const quickEdit = State.getQuickEdit(state);
    const goal = Selectors.getGoalById(state, quickEdit.get('goalId'));
    const goalId = goal.get('id');

    dispatch(saveStart(goalId, Analytics.EventNames.clickPublishOnQuickEdit));
    return Api.goals.publishLatestDraft(goalId).then(() => {
      const latestDraft = goal.getIn([ 'narrative', 'draft' ]).toJS();
      dispatch(DataActions.updateById(goalId, {
        narrative: {
          published: latestDraft,
          draft: latestDraft
        }
      }));
      dispatch(saveSuccess());
    }).
    catch(error => {// eslint-disable-line dot-notation
      dispatch(saveError(error.message));
    });
  };
};

/**
 * Saves quick edit form to API.
 * Fetches form data from state. Rebuilds data to API format.
 * Sends error message on failure
 * Dispatches necessary actions to reload table row on success
 */
export function save() {
  return (dispatch, getState) => {
    const state = getState();
    const translations = state.get('translations');

    const quickEdit = State.getQuickEdit(state);
    const formData = quickEdit.get('formData');
    const goal = Selectors.getGoalById(state, quickEdit.get('goalId'));
    const goalId = goal.get('id');
    const version = goal.get('version');
    const values = {
      'is_public': formData.get('visibility') == 'public',
      'name': formData.get('name'),
      'action': formData.get('actionType'),
      'subject': formData.get('prevailingMeasureName'),
      'override': formData.get('prevailingMeasureProgressOverride') == 'none' ?
        '' : formData.get('prevailingMeasureProgressOverride'),
      'unit': formData.get('unit'),
      'delta_is_percent': formData.get('percentUnit') == '%',
      'start': formData.get('startDate'),
      'end': formData.get('endDate'),
      'target': formData.get('measureTarget'),
      'target_type': formData.get('measureTargetType'),
      'baseline': formData.get('measureBaseline'),
      'delta': formData.get('measureTargetDelta'),
      'maintain_type': formData.get('measureMaintainType')
    };

    dispatch(saveStart(goalId, Analytics.EventNames.clickUpdateOnQuickEdit));

    return Api.goals.update(goalId, version, values).then(updatedGoal => {
      const successMessage = Helpers.translator(translations, 'admin.quick_edit.success_message', updatedGoal.name);

      // TODO: Consider combining these actions. They're redundant.
      dispatch(DataActions.updateById(goalId, updatedGoal));
      dispatch({
        notification: { type: 'success', message: successMessage },
        ...saveSuccess()
      });
      dispatch(closeModal());
    }).
    catch(error => {// eslint-disable-line dot-notation
      dispatch(saveError(error.message));
    });
  };
}
