import * as api from '../../../api';
import * as DataActions from './data';
import * as SharedActions from '../../shared/actions';
import * as Helpers from '../../../helpers';

export const types = {
  openModal: 'goals.quickEdit.openModal',
  closeModal: 'goals.quickEdit.closeModal'
};

export const openModal = goalId => ({
  type: types.openModal,
  goalId
});

export const closeModal = () => ({
  type: types.closeModal
});

export const save = (goalId, goalVersion, data) => (dispatch, getState) => {
  const translations = getState().get('translations');

  dispatch(SharedActions.setModalInProgress('goals', 'quickEdit', true));
  dispatch(SharedActions.hideModalMessage('goals', 'quickEdit'));

  return api.goals.update(goalId, goalVersion, data).then(updatedGoal => {
    const successMessage = Helpers.translator(translations, 'admin.quick_edit.success_message', updatedGoal.name);

    dispatch(DataActions.updateById(goalId, updatedGoal));
    dispatch(SharedActions.showGlobalMessage('goals', successMessage, 'success'));
    dispatch(closeModal());
  }).catch(_ => {
    const failureMessage = Helpers.translator(translations, 'admin.quick_edit.default_alert_message');
    dispatch(SharedActions.showModalMessage('goals', 'quickEdit', failureMessage));
    dispatch(SharedActions.setModalInProgress('goals', 'quickEdit', false));
  });
};
