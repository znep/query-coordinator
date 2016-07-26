import GoalTableHead from 'components/GoalTableHead';
import translations from 'mockTranslations';

var getDefaultStore = require('testStore').getDefaultStore;

describe('components/GoalTableHead', function() {
  beforeEach(function() {
    var state = {
      translations: translations,
      goalTableData: {
        tableOrder: {
          column: 'title',
          direction: 'asc'
        }
      }
    };

    this.output = renderComponentWithStore(GoalTableHead, {}, getDefaultStore(state));
  });

  it('should have 1 row', function() {
    expect(this.output.querySelectorAll('tr').length).to.eq(1);
  });

  it('should have 8 columns in a row', function() {
    expect(this.output.querySelectorAll('tr:first-child th').length).to.eq(9);
  });

  it('should have columns with correct translations', function() {
    expect(this.output.querySelectorAll('tr:first-child th.table-heading-title')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.title'));

    expect(this.output.querySelectorAll('tr:first-child th.table-heading-owner')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.owner'));

    expect(this.output.querySelectorAll('tr:first-child th.table-heading-updated_at')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.updated_at'));

    expect(this.output.querySelectorAll('tr:first-child th.table-heading-visibility')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.visibility'));

    expect(this.output.querySelectorAll('tr:first-child th.table-heading-goal_status')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.goal_status'));

    expect(this.output.querySelectorAll('tr:first-child th.table-heading-dashboard')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.dashboard'));
  });

  it('should have correct order icon', function() {
    expect(this.output.querySelectorAll('tr:first-child th.table-heading-title span.order-icon').item(0).getAttribute('class')).
      to.contain('icon-arrow-down');
  });

});
