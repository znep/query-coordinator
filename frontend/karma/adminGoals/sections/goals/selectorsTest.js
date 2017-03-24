import Immutable from 'immutable';
import * as Selectors from 'sections/goals/selectors';

const EQUAL_STATE = Immutable.fromJS({
  goals: {
    data: [
      { id: 'a', is_public: true },
      { id: 'b', is_public: true }
    ],
    ui: {
      selectedGoalIds: ['a', 'b']
    }
  }
});

const DIFFERENT_STATE = Immutable.fromJS({
  goals: {
    data: [
      { id: 'a', is_public: false },
      { id: 'b', is_public: true }
    ],
    ui: {
      selectedGoalIds: ['a', 'b']
    }
  }
});

describe('sections/goals/selectors/getCommonGoalData', () => {
  it('should extract common data among the given goals', () => {
    const commonData = Selectors.getCommonData(EQUAL_STATE);
    expect(commonData.get('is_public')).to.eq(true);
  });

  it('should set null for differences', () => {
    const commonData = Selectors.getCommonData(DIFFERENT_STATE);
    expect(commonData.get('is_public')).to.eq(null);
  });
});


const SELECTION_STATE = Immutable.fromJS({
  goals: {
    data: [
      { id: 'a', is_public: true },
      { id: 'b', is_public: true }
    ],
    ui: {
      selectedGoalIds: ['a', 'b']
    }
  }
});

describe('sections/goals/selectors/getSelectedGoals', () => {
  it('should gather selected goal data', () => {
    const goals = Selectors.getSelectedGoals(SELECTION_STATE);

    expect(goals.get(0).get('id')).to.eq('a');
    expect(goals.get(1).get('id')).to.eq('b');
  });
});
