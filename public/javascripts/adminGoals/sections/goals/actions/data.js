import * as api from '../../../api';
import * as SharedActions from '../../shared/actions';
import * as Immutable from 'immutable';
import * as Helpers from '../../../helpers';
import * as State from '../state';

export const types = {
  setAll: 'goals.data.setAll',
  updateById: 'goals.data.updateById',
  updateAll: 'goals.data.updateAll'
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

export const updateAll = goals => ({
  type: types.updateAll,
  goals
});

export const load = () => (dispatch, getState) => {
  dispatch(SharedActions.loading.start());

  return api.goals.getAll().
    then(goals => {
      dispatch(setAll(Immutable.fromJS(goals)));
      dispatch(SharedActions.loading.stop());
    }).
    catch(() => { // eslint-disable-line dot-notation
      const translations = State.getTranslations(getState());
      const message = Helpers.translator(translations, 'admin.listing.load_error');

      dispatch(SharedActions.showGlobalMessage('goals', message));
    });
};
