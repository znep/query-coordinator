import * as api from '../../../api';
import * as Actions from '../../../actions';
import * as SharedActions from '../../shared/actions';
import * as Immutable from 'immutable';
import * as Helpers from '../../../helpers';
import * as State from '../state';
import Airbrake from '../../../../common/airbrake';

export const types = {
  setAll: 'goals.data.setAll',
  updateById: 'goals.data.updateById'
};

export const setAll = goals => ({
  type: types.setAll,
  goals
});

export const updateById = (goalId, data) => ({
  type: types.updateById,
  goalId,
  data
});

export const load = () => (dispatch, getState) => {
  dispatch(SharedActions.loading.start());

  return api.goals.getAll().
    then(goals => {
      dispatch(setAll(Immutable.fromJS(goals)));
      dispatch(SharedActions.loading.stop());
    }).
    catch((error) => {
      const translations = State.getTranslations(getState());
      const message = Helpers.translator(translations, 'admin.listing.load_error');

      Airbrake.notify(error);
      dispatch(Actions.notifications.showNotification('error', message));
      dispatch(SharedActions.loading.stop());
    });
};
