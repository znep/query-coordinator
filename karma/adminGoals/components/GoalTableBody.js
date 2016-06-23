import GoalTableBody from 'components/GoalTableBody';
import moment from 'moment';

import { fromJS } from 'immutable';

import goals from '../data/goalTableActions/propGoals';
import dashboards from '../data/goalTableActions/propDashboards';

import translations from 'mockTranslations';

var getDefaultStore = require('testStore').getDefaultStore;

describe('components/GoalTableBody', function() {
  beforeEach(function() {
    var state = {
      goalTableData: {
        goals: goals,
        dashboards: dashboards,
        translations: translations,
        selectedRows: []
      }
    };

    this.output = renderComponentWithStore(GoalTableBody, state.goalTableData, getDefaultStore(state));
  });

  it('should have 4 rows', function() {
    expect(this.output.querySelectorAll('tr').length).to.eq(4);
  });

  it('should have 8 columns in a row', function() {
    expect(this.output.querySelectorAll('tr:first-child td').length).to.eq(8);
  });

  it('should have columns with correct data', function() {
    expect(this.output.querySelectorAll('tr:first-child td:nth-child(2)')[0].textContent).
      to.contain(goals[0].name);

    expect(this.output.querySelectorAll('tr:first-child td:nth-child(3)')[0].textContent).
      to.eq(goals[0].created_by.displayName);

    expect(this.output.querySelectorAll('tr:first-child td:nth-child(4)')[0].textContent).
      to.eq(moment(goals[0].updated_at).format('ll'));

    expect(this.output.querySelectorAll('tr:first-child td:nth-child(5)')[0].textContent).
      to.eq(_.get(translations, 'admin.goal_values.' + (goals[0].is_public ? 'status_public' : 'status_private')));

    expect(this.output.querySelectorAll('tr:first-child td:nth-child(6)')[0].textContent).
      to.eq(_.get(translations, `measure.progress.${goals[0].prevailingMeasureProgress}`));

    expect(this.output.querySelectorAll('tr:first-child td:nth-child(7)')[0].textContent).
      to.contain(dashboards[goals[0].base_dashboard].name);
  });

});
