import Immutable from 'immutable';
import { assert } from 'chai';
import GoalTableRow from 'adminGoals/sections/goals/components/GoalTable/GoalTableRow';
import propGoals, { goalsWithPublicationState } from '../../../data/goalTableActions/propGoals';

import translations from 'mockTranslations';

const getDefaultStore = require('testStore').getDefaultStore;

// Avoid a warning about div > tr that would otherwise be generated
// due to TestUtils.renderIntoDocument.
class RowWrapper extends React.Component {
  render() {
    return (
      <table><tbody>
        <GoalTableRow {...this.props} />
      </tbody></table>
    );
  }
}

describe('sections/goals/components/GoalTable/GoalTableRow', () => {
  const renderWithGoal = (goal) => {
    assert.isOk(goal);
    const state = {
      translations,
      goals: {
        data: propGoals
      }
    };

    const props = {
      goal: Immutable.fromJS(goal)
    };

    return renderComponentWithStore(
      RowWrapper,
      props,
      getDefaultStore(state)
    );
  };

  describe('Visibility column', () => {
    const assertGoalHasStatus = (goal, expectedTranslationKey) => {
      it(`reports ${expectedTranslationKey} for ${goal.name}`, () => {
        const rendering = renderWithGoal(goal);
        const visibilityCell = rendering.querySelectorAll('td.visibility');
        assert.lengthOf(visibilityCell, 1);
        assert.equal(
          visibilityCell[0].innerHTML,
          _.get(translations, `admin.goal_values.${expectedTranslationKey}`)
        );
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

});
