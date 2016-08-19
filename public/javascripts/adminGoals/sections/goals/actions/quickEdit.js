import * as Api from '../../../api';
import * as DataActions from './data';
import * as SharedActions from '../../shared/actions';
import * as Helpers from '../../../helpers';
import * as State from '../state';
import * as Selectors from '../selectors';

export const types = {
  openModal: 'goals.quickEdit.openModal',
  closeModal: 'goals.quickEdit.closeModal',
  updateFormData: 'goals.quickEdit.updateFormData'
};

export const openModal = goalId => ({
  type: types.openModal,
  goalId
});

export const closeModal = () => ({
  type: types.closeModal
});

export const updateFormData = data => ({
  type: types.updateFormData,
  data
});

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

    dispatch(SharedActions.setModalInProgress('goals', 'quickEdit', true));
    dispatch(SharedActions.hideModalMessage('goals', 'quickEdit'));

    return Api.goals.update(goalId, version, values).then(updatedGoal => {
      const successMessage = Helpers.translator(translations, 'admin.quick_edit.success_message', updatedGoal.name);

      dispatch(DataActions.updateById(goalId, updatedGoal));
      dispatch(SharedActions.showGlobalMessage('goals', successMessage, 'success'));
      dispatch(closeModal());
    }).catch(() => {
      const failureMessage = Helpers.translator(translations, 'admin.quick_edit.default_alert_message');
      dispatch(SharedActions.showModalMessage('goals', 'quickEdit', failureMessage));
      dispatch(SharedActions.setModalInProgress('goals', 'quickEdit', false));
    });
  };
}
