import Immutable from 'immutable';
import { assert } from 'chai';
import GoalTableRow from 'sections/goals/components/GoalTable/GoalTableRow';
import { goalsWithPublicationState as goals } from '../../../data/goalTableActions/propGoals';

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
    const state = { translations };

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

    assertGoalHasStatus(goals.noPublicationStateReportedPrivate, 'status_private');
    assertGoalHasStatus(goals.noPublicationStateReportedPublic, 'status_public');
    assertGoalHasStatus(goals.neverEdited, 'status_private');
    assertGoalHasStatus(goals.publicMigratedNotPublished, 'status_public_with_draft');
    assertGoalHasStatus(goals.neverPublished, 'status_private');
    assertGoalHasStatus(goals.unpublished, 'status_private');
    assertGoalHasStatus(goals.unpublishedWithDraft, 'status_private');
    assertGoalHasStatus(goals.published, 'status_public');
    assertGoalHasStatus(goals.publishedWithDraft, 'status_public_with_draft');
  });

});
