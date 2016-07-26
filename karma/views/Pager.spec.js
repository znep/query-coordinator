var $ = require('jquery');
var Pager = require('../../src/views/Pager');
var COLUMN_NAME = 'column_name';
var DATASET_UID = 'asdf-fdsa';
var DOMAIN = 'localhost';

describe('Pager', function() {
  var element;
  var pager;
  var previousButton;
  var nextButton;
  var pagerLabel;
  var vif;

  beforeEach(function() {
    vif = {
      'aggregation': {
        'columnName': null,
        'function': 'count'
      },
      'columnName': COLUMN_NAME,
      'configuration': {
        'localization': {
          'previous': 'translation for previous button',
          'next': 'translation for next button',
          'no_rows': 'translation for no rows',
          'only_row': 'translation for only one row',
          'many_rows': 'translation for many rows',
          'all_rows': 'translation for all rows'
        },
        'order': [{
          ascending: true,
          columnName: COLUMN_NAME
        }]
      },
      'createdAt': '2014-01-01T00:00:00',
      'datasetUid': DATASET_UID,
      'domain': DOMAIN,
      'filters': [],
      'format': {
        'type': 'visualization_interchange_format',
        'version': 1
      },
      'origin': {
        'type': 'test_data',
        'url': 'localhost'
      },
      'title': COLUMN_NAME,
      'type': 'table',
      'unit': {
        'one': 'case',
        'other': 'cases'
      }
    };
  });

  afterEach(function() {
    pager.destroy();
  });

  describe('at the first of several pages', function() {
    renderPagerWithOptions({
      startIndex: 0,
      endIndex: 10,
      datasetRowCount: 1000
    });

    verifyPreviousButtonDisabledBehavior();
    verifyNextButtonEnabledBehavior();
  });

  describe('in the middle of 10 pages', function() {
    renderPagerWithOptions({
      startIndex: 100,
      endIndex: 200,
      datasetRowCount: 1000
    });

    verifyPreviousButtonEnabledBehavior();
    verifyNextButtonEnabledBehavior();
  });

  describe('on the last page', function() {
    renderPagerWithOptions({
      startIndex: 900,
      endIndex: 999,
      datasetRowCount: 901
    });

    verifyPreviousButtonEnabledBehavior();
    verifyNextButtonDisabledBehavior();
  });

  describe('pager buttons', function() {
    describe('with a page size equal to dataset row count', function() {
      renderPagerWithOptions({
        startIndex: 0,
        endIndex: 5,
        datasetRowCount: 5
      });

      it('should hide each button using a class on the parent', function() {
        assert.isTrue(element.find('.socrata-pager').hasClass('socrata-pager-single-page'));
      });
    });
  });

  describe('pager label', function() {

    describe('with no rows', function() {
      renderPagerWithOptions({
        startIndex: 0,
        endIndex: 0,
        datasetRowCount: 0
      });

      it('should format the translation with the correct parameters', function() {

        assert.match(pagerLabel.text(), /no cases/i);
      });
    });

    describe('with a page size of one', function() {

      renderPagerWithOptions({
        startIndex: 9,
        endIndex: 10,
        datasetRowCount: 10
      });

      it('should format the translation with the correct parameters', function() {
        assert.match(pagerLabel.text(), /showing case/i);
      });
    });

    describe('with a page size equal to dataset row count', function() {

      renderPagerWithOptions({
        startIndex: 0,
        endIndex: 5,
        datasetRowCount: 5
      });

      it('should format the translation with the correct parameters', function() {
        assert.match(pagerLabel.text(), /showing all/i);
      });
    });

    describe('with an invalid dataset row count', function() {

      renderPagerWithOptions({
        startIndex: 0,
        endIndex: 5,
        datasetRowCount: NaN
      });

      it('should format the translation with the correct parameters', function() {
        assert.match(pagerLabel.text(), /row count unavailable/i);
      });
    });

    describe('with a page size of 10', function() {

      renderPagerWithOptions({
        startIndex: 0,
        endIndex: 9,
        datasetRowCount: 10
      });

      it('should format the translation with the correct parameters', function() {
        assert.match(pagerLabel.text(), /showing cases/i);
      });
    });
  });


  /**
   * Helpers
   */

  function renderPagerWithOptions(options) {
    beforeEach(function() {
      element = $('<div>');
      pager = new Pager(element, vif);
      pager.render(options);
      previousButton = element.find('.pager-button-previous');
      nextButton = element.find('.pager-button-next');
      pagerLabel = element.find('.pager-label');
    });
  }

  function verifyPreviousButtonDisabledBehavior() {
    describe('previous button', function() {
      it('should be disabled', function() {
        assert.isTrue(previousButton.prop('disabled'));
      });
    });
  }

  function verifyPreviousButtonEnabledBehavior() {
    describe('previous button', function() {
      it('should be enabled', function() {
        assert.isFalse(previousButton.prop('disabled'));
      });

      it('should emit SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS when clicked', function(done) {
        element.on('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS', function() { done(); });
        previousButton.click();
      });
    });
  }

  function verifyNextButtonDisabledBehavior() {
    describe('next button', function() {
      it('should be disabled', function() {
        assert.isTrue(nextButton.prop('disabled'));
      });
    });
  }

  function verifyNextButtonEnabledBehavior() {
    describe('next button', function() {
      it('should be enabled', function() {
        assert.isFalse(nextButton.prop('disabled'));
      });

      it('should emit SOCRATA_VISUALIZATION_PAGINATION_NEXT when clicked', function(done) {
        element.on('SOCRATA_VISUALIZATION_PAGINATION_NEXT', function() { done(); });
        nextButton.click();
      });
    });
  }

});
