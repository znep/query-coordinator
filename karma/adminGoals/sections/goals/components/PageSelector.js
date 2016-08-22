import PageSelector from 'sections/goals/components/GoalTable/PageSelector';
import translations from 'mockTranslations';
import Immutable from 'immutable';

var getDefaultStore = require('testStore').getDefaultStore;

describe('sections/goals/components/GoalTable/PageSelector', function () {
  it('should have correct offset numbers', function () {
    var state = Immutable.fromJS({
      translations: translations,
      goals: {
        data: Array.apply(null, Array(100)),
        ui: {
          pagination: {
            currentPage: 1,
            goalsPerPage: 10
          }
        }
      }
    });

    var output = renderComponentWithStore(PageSelector, {}, getDefaultStore(state));

    expect(output.querySelectorAll('span').item(0).textContent).to.eq(`10 - 20 ${translations.admin.listing.of} 100`);
  });

  it('should start with 1 in first page', function () {
    var state = {
      translations: translations,
      goals: {
        data: Array.apply(null, Array(100)),
        ui: {
          pagination: {
            currentPage: 0,
            goalsPerPage: 10
          }
        }
      }
    };

    var output = renderComponentWithStore(PageSelector, {}, getDefaultStore(state));

    expect(output.querySelectorAll('span').item(0).textContent).to.eq(`1 - 10 ${translations.admin.listing.of} 100`);
  });

  it('prev link should be disabled in first page', function () {
    var state = {
      translations: translations,
      goals: {
        data: Array.apply(null, Array(100)),
        ui: {
          pagination: {
            currentPage: 0,
            goalsPerPage: 10
          }
        }
      }
    };

    var output = renderComponentWithStore(PageSelector, {}, getDefaultStore(state));

    expect(output.querySelectorAll('span').item(1).classList.contains('disabled')).to.be.true;
  });

  it('next link should be disabled in last page', function () {
    var state = {
      translations: translations,
      goals: {
        data: Array.apply(null, Array(100)),
        ui: {
          pagination: {
            currentPage: 9,
            goalsPerPage: 10
          }
        }
      }
    };

    var output = renderComponentWithStore(PageSelector, {}, getDefaultStore(state));

    expect(output.querySelectorAll('span').item(2).classList.contains('disabled')).to.be.true;
  });

  it('prev & next link shouldnt be disabled in middle pages', function () {
    var state = {
      translations: translations,
      goals: {
        data: Array.apply(null, Array(100)),
        ui: {
          pagination: {
            currentPage: 5,
            goalsPerPage: 10
          }
        }
      }
    };

    var output = renderComponentWithStore(PageSelector, {}, getDefaultStore(state));

    expect(output.querySelectorAll('span').item(2).classList.contains('disabled')).to.not.be.true;
    expect(output.querySelectorAll('span').item(2).classList.contains('disabled')).to.not.be.true;
  });

  it('prev & next link should be disabled if there is only 1 page', function () {
    var state = {
      translations: translations,
      goals: {
        data: Array.apply(null, Array(9)),
        ui: {
          pagination: {
            currentPage: 0,
            goalsPerPage: 10
          }
        }
      }
    };

    var output = renderComponentWithStore(PageSelector, {}, getDefaultStore(state));

    expect(output.querySelectorAll('span').item(2).classList.contains('disabled')).to.be.true;
    expect(output.querySelectorAll('span').item(2).classList.contains('disabled')).to.be.true;
  });

});
