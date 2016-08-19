import _ from 'lodash';
import GoalTableHead from 'components/GoalTableHead';
import translations from 'mockTranslations';

const getDefaultStore = require('testStore').getDefaultStore;

describe('components/GoalTableHead', () => {
  let output;

  beforeEach(() => {
    const state = {
      translations: translations,
      goalTableData: {
        selectedRows: [],
        goals: []
      }
    };

    output = renderComponentWithStore(GoalTableHead, {}, getDefaultStore(state));
  });

  it('should have 1 row', () => {
    expect(output.querySelectorAll('tr').length).to.eq(1);
  });

  it('should have 8 columns in a row', () => {
    expect(output.querySelectorAll('tr:first-child th').length).to.eq(8);
  });

  it('should have columns with correct translations', () => {
    expect(output.querySelectorAll('tr:first-child th.table-heading-title')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.title'));

    expect(output.querySelectorAll('tr:first-child th.table-heading-owner')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.owner'));

    expect(output.querySelectorAll('tr:first-child th.table-heading-updated_at')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.updated_at'));

    expect(output.querySelectorAll('tr:first-child th.table-heading-visibility')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.visibility'));

    expect(output.querySelectorAll('tr:first-child th.table-heading-goal_status')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.goal_status'));

    expect(output.querySelectorAll('tr:first-child th.table-heading-dashboard')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.dashboard'));
  });

});

describe('components/GoalTableHead sorting', () => {
  const getComponent = (label, direction) => {
    const state = {
      translations: translations,
      goalTableData: {
        tableOrder: { column: label, direction: direction },
        selectedRows: [],
        goals: []
      }
    };

    return renderComponentWithStore(GoalTableHead, {}, getDefaultStore(state));
  };

  const titlesList = ['title', 'owner', 'updated_at', 'visibility', 'goal_status', 'dashboard'];

  _.each(titlesList, label => {

    it(`${label} should have correct order icon`, function() {
      const componentAsc = getComponent(label, 'asc');
      const componentDesc = getComponent(label, 'desc');

      expect(componentAsc.querySelectorAll(`th.table-heading-${label} span.order-icon`).item(0).getAttribute('class')).
        to.contain('icon-arrow-up');

      expect(componentDesc.querySelectorAll(`th.table-heading-${label} span.order-icon`).item(0).getAttribute('class')).
        to.contain('icon-arrow-down');
    });

  });
});

describe('components/GoalTableHead check all toggle', () => {
  it('should have unchecked', () => {
    const state = {
      translations: translations,
      goalTableData: {
        selectedRows: [1, 2],
        goals: [1, 2, 3]
      }
    };

    const output = renderComponentWithStore(GoalTableHead, {}, getDefaultStore(state));
    expect(output.querySelectorAll('tr:first-child .icon-checkmark3').length).to.eq(0);
  });

  it('should have checked', () => {
    const state = {
      translations: translations,
      goalTableData: {
        selectedRows: [1, 2, 3],
        goals: [1, 2, 3]
      }
    };

    const output = renderComponentWithStore(GoalTableHead, {}, getDefaultStore(state));
    expect(output.querySelectorAll('tr:first-child .icon-checkmark3').length).to.eq(1);
  });
});
