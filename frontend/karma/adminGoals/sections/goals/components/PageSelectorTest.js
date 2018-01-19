import { assert } from 'chai';
import PageSelector from 'adminGoals/sections/goals/components/GoalTable/PageSelector';
import translations from 'mockTranslations';
import Immutable from 'immutable';

var getDefaultStore = require('testStore').getDefaultStore;

describe('sections/goals/components/GoalTable/PageSelector', () => {
  it('should have correct offset numbers', () => {
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

    assert.equal(
      output.querySelectorAll('span').item(0).textContent,
      `11 - 20 ${translations.admin.listing.of} 100`
    );
  });

  it('should start with 1 in first page', () => {
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

    assert.equal(
      output.querySelectorAll('span').item(0).textContent,
      `1 - 10 ${translations.admin.listing.of} 100`
    );
  });

  it('prev link should be disabled in first page', () => {
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

    assert.isTrue(output.querySelectorAll('span').item(1).classList.contains('disabled'));
  });

  it('next link should be disabled in last page', () => {
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

    assert.isTrue(output.querySelectorAll('span').item(2).classList.contains('disabled'));
  });

  it('prev & next link shouldnt be disabled in middle pages', () => {
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

    assert.isFalse(output.querySelectorAll('span').item(2).classList.contains('disabled'));
  });

  it('prev & next link should be disabled if there is only 1 page', () => {
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

    assert.isTrue(output.querySelectorAll('span').item(2).classList.contains('disabled'));
    assert.isTrue(output.querySelectorAll('span').item(2).classList.contains('disabled'));
  });

});
