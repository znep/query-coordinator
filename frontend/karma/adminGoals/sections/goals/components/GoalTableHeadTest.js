import { expect, assert } from 'chai';
import _ from 'lodash';
import Immutable from 'immutable';
import GoalTableHead from 'adminGoals/sections/goals/components/GoalTable/GoalTableHead';
import translations from 'mockTranslations';

const getDefaultStore = require('testStore').getDefaultStore;

// Avoid a warning about div > tbody that would otherwise be generated
// due to TestUtils.renderIntoDocument.
class TableWrapper extends React.Component {
  render() {
    return (
      <table>
        <GoalTableHead />
      </table>
    );
  }
}

describe('sections/goals/components/GoalTable/GoalTableHead', () => {
  let output;

  beforeEach(() => {
    const state = Immutable.fromJS({
      translations: translations,
      goals: {
        data: [],
        ui: {
          selectedGoalIds: [],
          sorting: {
            fieldName: 'default',
            fieldType: 'string',
            direction: 'asc'
          },
          pagination: {
            currentPage: 0,
            goalsPerPage: 25
          }
        }
      }
    });

    output = renderComponentWithStore(TableWrapper, {}, getDefaultStore(state));
  });

  it('should have 1 row', () => {
    expect(output.querySelectorAll('tr').length).to.eq(1);
  });

  it('should have 8 columns in a row', () => {
    expect(output.querySelectorAll('tr:first-child th').length).to.eq(7);
  });

  it('should have columns with correct translations', () => {
    expect(output.querySelectorAll('tr:first-child th.table-heading-title')[0].textContent).to.eq(_.get(translations, 'admin.listing.title'));

    expect(output.querySelectorAll('tr:first-child th.table-heading-owner')[0].textContent).to.eq(_.get(translations, 'admin.listing.owner'));

    expect(output.querySelectorAll('tr:first-child th.table-heading-updated_at')[0].textContent).to.eq(_.get(translations, 'admin.listing.updated_at'));

    expect(output.querySelectorAll('tr:first-child th.table-heading-visibility')[0].textContent).to.eq(_.get(translations, 'admin.listing.visibility'));

    expect(output.querySelectorAll('tr:first-child th.table-heading-goal_status')[0].textContent).to.eq(_.get(translations, 'admin.listing.goal_status'));

    expect(output.querySelectorAll('tr:first-child th.table-heading-dashboard')[0].textContent).to.eq(_.get(translations, 'admin.listing.dashboard'));
  });

});

describe('sections/goals/components/GoalTable/GoalTableHead sorting', () => {
  const getComponent = (label, direction) => {
    const state = Immutable.fromJS({
      translations: translations,
      goals: {
        data: [],
        ui: {
          pagination: {
            currentPage: 0,
            goalsPerPage: 25
          },
          selectedGoalIds: [],
          sorting: {
            fieldName: label,
            fieldType: 'string',
            direction: direction
          }
        }
      }
    });

    return renderComponentWithStore(TableWrapper, {}, getDefaultStore(state));
  };

  const titlesList = ['title', 'owner', 'updated_at', 'visibility', 'goal_status', 'dashboard'];

  _.each(titlesList, label => {

    it(`${label} should have correct order icon`, () => {
      const componentAsc = getComponent(label, 'asc');
      const componentDesc = getComponent(label, 'desc');

      expect(componentAsc.querySelectorAll(`th.table-heading-${label} span.order-icon`).item(0).getAttribute('class')).to.contain('icon-arrow-up');

      expect(componentDesc.querySelectorAll(`th.table-heading-${label} span.order-icon`).item(0).getAttribute('class')).to.contain('icon-arrow-down');
    });

  });
});

describe('sections/goals/components/GoalTable/GoalTableHead check all toggle', () => {
  it('should have unchecked', () => {
    const state = Immutable.fromJS({
      translations: translations,
      goals: {
        data: [{id: 1}, {id: 2}, {id: 3}],
        ui: {
          selectedGoalIds: [1, 2],
          pagination: {
            currentPage: 0,
            goalsPerPage: 25
          },
          sorting: {
            fieldName: 'default',
            fieldType: 'string',
            direction: 'asc'
          }
        }
      }
    });

    const output = renderComponentWithStore(TableWrapper, {}, getDefaultStore(state));
    expect(output.querySelectorAll('tr:first-child .icon-checkmark3').length).to.eq(0);
  });

  it('should have checked', () => {
    const state = Immutable.fromJS({
      translations: translations,
      goals: {
        data: [{ id: 1 }, { id: 2 }, { id: 3 }],
        ui: {
          selectedGoalIds: [1, 2, 3],
          pagination: {
            currentPage: 0,
            goalsPerPage: 25
          },
          sorting: {
            fieldName: 'default',
            fieldType: 'string',
            direction: 'asc'
          }
        }
      }
    });

    const output = renderComponentWithStore(TableWrapper, {}, getDefaultStore(state));
    expect(output.querySelectorAll('tr:first-child .icon-checkmark3').length).to.eq(1);
  });
});
