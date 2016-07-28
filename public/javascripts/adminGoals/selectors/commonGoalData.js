import Immutable from 'immutable';
import { createSelector } from 'reselect';
import selectedGoalsSelector from './selectedGoals';

const getSameValue = (items, property) => {
  const firstItem = items.first();
  const firstValue = firstItem ? firstItem.get(property) : null;
  const allSame = items.every(item => item.get(property) === firstValue);
  return allSame ? firstValue : null;
};

export default createSelector(
  [selectedGoalsSelector],
  goals => new Immutable.Map({
    is_public: getSameValue(goals, 'is_public')
  })
);
