import { createSelector } from 'reselect';

const goalIdsSelector = (state) => state.getIn(['goalTableData', 'selectedRows']);
const goalsSelector = (state) => state.getIn(['goalTableData', 'goals']);

export default createSelector(
  [goalIdsSelector, goalsSelector],
  (goalIds, goals) => {
    return goalIds.map(id => goals.filter(x => x.get('id') == id).first());
  }
);


