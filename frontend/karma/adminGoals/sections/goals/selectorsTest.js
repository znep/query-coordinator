import { expect, assert } from 'chai';
import _ from 'lodash';
import Immutable from 'immutable';
import * as Selectors from 'adminGoals/sections/goals/selectors';
import propGoals, { goalsWithPublicationState } from '../../data/goalTableActions/propGoals';

const EQUAL_STATE = Immutable.fromJS({
  goals: {
    data: [
      { id: 'a', publishing_action: 'make_private', prevailing_measure: { start: 'foo' } },
      { id: 'b', publishing_action: 'make_private', prevailing_measure: { start: 'foo' } }
    ],
    ui: {
      selectedGoalIds: ['a', 'b']
    }
  }
});

const DIFFERENT_STATE = Immutable.fromJS({
  goals: {
    data: [
      { id: 'a', publishing_action: 'pulish_latest_draft', prevailing_measure: { start: 'foo' } },
      { id: 'b', publishing_action: 'make_private', prevailing_measure: { start: 'bar', end: 'baz' } }
    ],
    ui: {
      selectedGoalIds: ['a', 'b']
    }
  }
});

describe('sections/goals/selectors/getCommonGoalData', () => {
  it('should extract common data among the given goals', () => {
    const commonData = Selectors.getCommonData(EQUAL_STATE).toJS();
    assert.propertyVal(commonData, 'publishing_action', 'make_private');
    assert.deepNestedPropertyVal(commonData, 'prevailing_measure.start', 'foo');
  });

  it('should set null for differences', () => {
    const commonData = Selectors.getCommonData(DIFFERENT_STATE).toJS();
    assert.propertyVal(commonData, 'publishing_action', null);
    assert.deepNestedPropertyVal(commonData, 'prevailing_measure.start', null);
    assert.deepNestedPropertyVal(commonData, 'prevailing_measure.end', null);
  });
});


describe('sections/goals/selectors/getSelectedGoals', () => {
  const GOAL_DATA = [
    { id: 'a', is_public: true },
    { id: 'b', is_public: true },
    { id: 'c', is_public: true }
  ];

  const itShouldReturnGoalsWithIDs = (state, expectedIDs) => {
    it(`should return ${expectedIDs.length} goal(s)`, () => {
      const goals = Selectors.getSelectedGoals(Immutable.fromJS(state)).toJS();
      assert.deepEqual(_.map(goals, 'id'), expectedIDs);
    });
  };

  describe('no goals loaded', () => {
    itShouldReturnGoalsWithIDs(
      {
        goals: {
          data: [],
          ui: {
            selectedGoalIds: []
          }
        }
      },
      []
    );
  });

  describe('no goals selected', () => {
    itShouldReturnGoalsWithIDs(
      {
        goals: {
          data: GOAL_DATA,
          ui: {
            selectedGoalIds: []
          }
        }
      },
      []
    );
  });

  describe('two goals selected', () => {
    itShouldReturnGoalsWithIDs(
      {
        goals: {
          data: GOAL_DATA,
          ui: {
            selectedGoalIds: ['a', 'c']
          }
        }
      },
      [ 'a', 'c' ]
    );
  });

  describe('two goals selected, but one is no longer in the goal list', () => {
    itShouldReturnGoalsWithIDs(
      {
        goals: {
          data: GOAL_DATA,
          ui: {
            selectedGoalIds: ['a', 'x']
          }
        }
      },
      [ 'a' ]
    );
  });
});

describe('sections/goals/selectors/areAllSelectedGoalsConfigured', () => {
  const GOAL_DATA_NONE_CONFIGURED = [
    { id: 'a', is_public: true },
    { id: 'b', is_public: true }
  ];
  const GOAL_DATA_SOME_CONFIGURED = [
    { id: 'a', is_public: true, prevailing_measure: { foo: 4 } },
    { id: 'b', is_public: true, prevailing_measure: { foo: 4 } },
    { id: 'c', is_public: true },
    { id: 'd', is_public: true }
  ];

  const itReturnsTrueForState = (scenarioName, state) => {
    it(`returns true for ${scenarioName}`, () => {
      assert.isTrue(Selectors.areAllSelectedGoalsConfigured(Immutable.fromJS(state)));
    });
  };

  const itReturnsFalseForState = (scenarioName, state) => {
    it(`returns false for ${scenarioName}`, () => {
      assert.isFalse(Selectors.areAllSelectedGoalsConfigured(Immutable.fromJS(state)));
    });
  };

  itReturnsTrueForState('no goals', {
    goals: {
      data: [],
      ui: {
        selectedGoalIds: []
      }
    }
  });

  itReturnsFalseForState('a list containing only unconfigured goals', {
    goals: {
      data: GOAL_DATA_SOME_CONFIGURED,
      ui: {
        selectedGoalIds: [ 'c', 'd' ]
      }
    }
  });

  itReturnsFalseForState('a list containing configured and unconfigured goals', {
    goals: {
      data: GOAL_DATA_SOME_CONFIGURED,
      ui: {
        selectedGoalIds: [ 'a', 'd' ]
      }
    }
  });

  itReturnsTrueForState('a list of configured goals', {
    goals: {
      data: GOAL_DATA_SOME_CONFIGURED,
      ui: {
        selectedGoalIds: [ 'a', 'b' ]
      }
    }
  });

});

describe('sections/goals/selectors/getGoalPublicationStatus', () => {
  const assertGoalHasStatus = (goal, expectedStatus) => {
    const state = Immutable.fromJS({
      goals: {
        data: propGoals
      }
    });

    it(`reports ${expectedStatus} for ${goal.name}`, () => {
      assert.equal(Selectors.getGoalPublicationStatus(Immutable.fromJS(state), goal.id), expectedStatus);
    });
  };

  assertGoalHasStatus(goalsWithPublicationState.noPublicationStateReportedPrivate, 'status_private');
  assertGoalHasStatus(goalsWithPublicationState.noPublicationStateReportedPublic, 'status_public');
  assertGoalHasStatus(goalsWithPublicationState.neverEdited, 'status_private');
  assertGoalHasStatus(goalsWithPublicationState.publicMigratedNotPublished, 'status_public_with_draft');
  assertGoalHasStatus(goalsWithPublicationState.neverPublished, 'status_private');
  assertGoalHasStatus(goalsWithPublicationState.unpublished, 'status_private');
  assertGoalHasStatus(goalsWithPublicationState.unpublishedWithDraft, 'status_private');
  assertGoalHasStatus(goalsWithPublicationState.published, 'status_public');
  assertGoalHasStatus(goalsWithPublicationState.publishedWithDraft, 'status_public_with_draft');
});
