import { expect, assert } from 'chai';
import GoalTableBody from 'adminGoals/sections/goals/components/GoalTable/GoalTableBody';
import moment from 'moment';
import goals from '../../../data/goalTableActions/propGoals';

import translations from 'mockTranslations';

var getDefaultStore = require('testStore').getDefaultStore;

// Avoid a warning about div > tbody that would otherwise be generated
// due to TestUtils.renderIntoDocument.
class TableWrapper extends React.Component {
  render() {
    return (
      <table>
        <GoalTableBody />
      </table>
    );
  }
}

describe('sections/goals/components/GoalTable/GoalTableBody', function() {
  beforeEach(function() {
    var state = {
      translations: translations,
      goals: {
        data: goals,
        ui: {
          selectedGoalIds: [],
          pagination: {
            goalsPerPage: 50,
            currentPage: 0
          },
          sorting: {
            fieldName: 'default',
            fieldType: 'string',
            direction: 'asc'
          }
        }
      }
    };

    this.output = renderComponentWithStore(TableWrapper, state.goals.data, getDefaultStore(state));
  });

  it(`should have ${goals.length} rows`, function() {
    expect(this.output.querySelectorAll('tr').length).to.eq(goals.length);
  });

  it('should have 8 columns in a row', function() {
    expect(this.output.querySelectorAll('tr:first-child td').length).to.eq(8);
  });

  it('should have columns with correct data', function() {
    expect(this.output.querySelectorAll('tr:first-child td:nth-child(3)')[0].textContent).
      to.contain(goals[0].name);

    expect(this.output.querySelectorAll('tr:first-child td:nth-child(4)')[0].textContent).
      to.eq(goals[0].owner_name);

    expect(this.output.querySelectorAll('tr:first-child td:nth-child(5)')[0].textContent).
      to.eq(moment(goals[0].updated_at).format('ll'));

    expect(this.output.querySelectorAll('tr:first-child td:nth-child(6)')[0].textContent).
      to.eq(_.get(translations, 'admin.goal_values.' + (goals[0].is_public ? 'status_public' : 'status_private')));

    expect(this.output.querySelectorAll('tr:first-child td:nth-child(7)')[0].textContent).
      to.eq(_.get(translations, `measure.progress.${goals[0].prevailing_measure.metadata.progress_override}`));

    expect(this.output.querySelectorAll('tr:first-child td:nth-child(8)')[0].textContent).
      to.contain(goals[0].dashboard.name);
  });

});
