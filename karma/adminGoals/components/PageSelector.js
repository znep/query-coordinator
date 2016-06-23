import PageSelector from 'components/PageSelector';
import translations from 'mockTranslations';

var getDefaultStore = require('testStore').getDefaultStore;

describe('components/GoalTableHead', function() {
  it('should have correct offset numbers', function() {
    var state = {
      goalTableData: {
        translations: translations,
        rowsPerPage: 10,
        currentPage: 1,
        totalGoalCount: 100
      }
    };

    var output = renderComponentWithStore(PageSelector, {}, getDefaultStore(state));

    expect(output.querySelectorAll('span').item(0).textContent).to.eq(`10 - 20 ${translations.admin.listing.of} 100`);
  });

  it('should start with 1 in first page', function() {
    var state = {
      goalTableData: {
        translations: translations,
        rowsPerPage: 10,
        currentPage: 0,
        totalGoalCount: 100
      }
    };

    var output = renderComponentWithStore(PageSelector, {}, getDefaultStore(state));

    expect(output.querySelectorAll('span').item(0).textContent).to.eq(`1 - 10 ${translations.admin.listing.of} 100`);
  });

  it('prev link should be disabled in first page', function() {
    var state = {
      goalTableData: {
        translations: translations,
        rowsPerPage: 10,
        currentPage: 0,
        totalGoalCount: 100
      }
    };

    var output = renderComponentWithStore(PageSelector, {}, getDefaultStore(state));

    expect(output.querySelectorAll('span').item(1).classList.contains('disabled')).to.be.true;
  });

  it('next link should be disabled in last page', function() {
    var state = {
      goalTableData: {
        translations: translations,
        rowsPerPage: 10,
        currentPage: 10,
        totalGoalCount: 100
      }
    };

    var output = renderComponentWithStore(PageSelector, {}, getDefaultStore(state));

    expect(output.querySelectorAll('span').item(2).classList.contains('disabled')).to.be.true;
  });

});
