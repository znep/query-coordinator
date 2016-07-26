import Immutable from 'immutable';
import commonGoalDataSelector from 'selectors/commonGoalData';

const EQUAL_STATE = Immutable.fromJS({
  goalTableData: {
    selectedRows: ['a', 'b'],
    goals: [
      { id: 'a', is_public: true },
      { id: 'b', is_public: true }
    ]
  }
});

const DIFFERENT_STATE = Immutable.fromJS({
  goalTableData: {
    selectedRows: ['a', 'b'],
    goals: [
      { id: 'a', is_public: false },
      { id: 'b', is_public: true }
    ]
  }
});

describe('selectors/commonGoalData', () => {
  it('should extract common data among the given goals', () => {
    const commonData = commonGoalDataSelector(EQUAL_STATE);
    expect(commonData.get('is_public')).to.eq(true);
  });

  it('should set null for differences', () => {
    const commonData = commonGoalDataSelector(DIFFERENT_STATE);
    expect(commonData.get('is_public')).to.eq(null);
  });
});
