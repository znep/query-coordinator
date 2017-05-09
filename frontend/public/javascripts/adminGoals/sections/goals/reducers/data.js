import * as Immutable from 'immutable';
import * as ReduxImmutable from 'redux-immutablejs';
import * as Actions from '../actions/data';

const initialState = new Immutable.List;

const setAll = (state, { goals }) => new Immutable.List(goals);

const updateById = (state, { goalId, data }) => state.map(goal => goalId === goal.get('id') ? goal.merge(data) : goal);

export default ReduxImmutable.createReducer(initialState, {
  [Actions.types.setAll]: setAll,
  [Actions.types.updateById]: updateById
});
