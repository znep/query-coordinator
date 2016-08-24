import * as api from '../../../api';
import * as SharedActions from '../../shared/actions';
import * as Immutable from 'immutable';

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

export const load = () => dispatch => {
  dispatch(SharedActions.loading.start());

  return api.goals.getAll().
    then(goals => {
      dispatch(setAll(Immutable.fromJS(goals)));
      dispatch(SharedActions.loading.stop());
    }).
    catch(error => {// eslint-disable-line dot-notation
      dispatch(SharedActions.showGlobalMessage('goals', error.message));
    });
};
