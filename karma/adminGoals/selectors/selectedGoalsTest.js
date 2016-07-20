import Immutable from 'immutable';
import selectedGoalsSelector from 'selectors/selectedGoals';

const STATE = Immutable.fromJS({
  goalTableData: {
    selectedRows: ['a', 'b'],
    goals: [
      { id: 'a', is_public: true },
      { id: 'b', is_public: true }
    ]
  }
});

describe('selectors/selectedGoals', () => {
  it('should gather selected goal data', () => {
    const goals = selectedGoalsSelector(STATE);

    expect(goals.get(0).get('id')).to.eq('a');
    expect(goals.get(1).get('id')).to.eq('b');
  });
});
