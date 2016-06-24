import GoalTableHead from 'components/GoalTableHead';
import translations from 'mockTranslations';

var getDefaultStore = require('testStore').getDefaultStore;

describe('components/GoalTableHead', function() {
  beforeEach(function() {
    var state = {
      goalTableData: {
        translations: translations
      }
    };

    this.output = renderComponentWithStore(GoalTableHead, {}, getDefaultStore(state));
  });

  it('should have 1 row', function() {
    expect(this.output.querySelectorAll('tr').length).to.eq(1);
  });

  it('should have 8 columns in a row', function() {
    expect(this.output.querySelectorAll('tr:first-child th').length).to.eq(8);
  });

  it('should have columns with correct translations', function() {
    expect(this.output.querySelectorAll('tr:first-child th:nth-child(2)')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.title'));

    expect(this.output.querySelectorAll('tr:first-child th:nth-child(3)')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.owner'));

    expect(this.output.querySelectorAll('tr:first-child th:nth-child(4)')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.updated_at'));

    expect(this.output.querySelectorAll('tr:first-child th:nth-child(5)')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.visibility'));

    expect(this.output.querySelectorAll('tr:first-child th:nth-child(6)')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.goal_status'));

    expect(this.output.querySelectorAll('tr:first-child th:nth-child(7)')[0].textContent).
      to.eq(_.get(translations, 'admin.listing.dashboard'));
  });

});
