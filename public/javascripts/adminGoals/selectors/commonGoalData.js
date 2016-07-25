import Immutable from 'immutable';
import { createSelector } from 'reselect';
import selectedGoalsSelector from './selectedGoals';

const getSameValue = (items, ...properties) => {
  const firstItem = items.first();
  const firstValue = firstItem ? firstItem.getIn(properties) : null;
  const allSame = items.every(item => item.getIn(properties) === firstValue);
  return allSame ? firstValue : null;
};

export default createSelector(
  [selectedGoalsSelector],
  (goals) => Immutable.fromJS({
    is_public: getSameValue(goals, 'is_public'),
    prevailing_measure: {
      start: getSameValue(goals, 'prevailing_measure', 'start'),
      end: getSameValue(goals, 'prevailing_measure', 'end'),
      progress_override: getSameValue(goals, 'prevailing_measure', 'progress_override')
    }
  })
);


