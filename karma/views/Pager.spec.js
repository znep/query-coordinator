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
          'PREVIOUS': 'translation for previous button',
          'NEXT': 'translation for next button',
          'NO_ROWS': 'translation for no rows',
          'ONLY_ROW': 'translation for only one row',
          'MANY_ROWS': 'translation for many rows'
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

  describe('button localization', function() {
    renderPagerWithOptions({
      startIndex: 0,
      endIndex: 100,
      datasetRowCount: 1000
    });

    it('should reflect the localization strings in the vif', function() {
      assert.include(
        nextButton.text(),
        vif.configuration.localization.NEXT
      );
      assert.include(
        previousButton.text(),
        vif.configuration.localization.PREVIOUS
      );
    });
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

  describe('on the last of several pages', function() {
    renderPagerWithOptions({
      startIndex: 900,
      endIndex: 999,
      datasetRowCount: 1000
    });

    verifyPreviousButtonEnabledBehavior();
    verifyNextButtonDisabledBehavior();
  });

  describe('pager label', function() {
    beforeEach(function() {
      vif.configuration.localization.NO_ROWS = { format: sinon.stub().returns('translation for no rows') };
    });

    describe('with no rows', function() {
      renderPagerWithOptions({
        startIndex: 0,
        endIndex: 0,
        datasetRowCount: 0
      });

      verifyPagerLabelText('translation for no rows');

      it('should format the translation with the correct parameters', function() {
        sinon.assert.alwaysCalledWithExactly(
          vif.configuration.localization.NO_ROWS.format,
          {
            unitOne: 'case',
            unitOther: 'cases',
            firstRowOrdinal: undefined,
            lastRowOrdinal: undefined,
            datasetRowCount: '0'
          }
        );
      });
    });

    describe('with a page size of one', function() {
      beforeEach(function() {
        vif.configuration.localization.ONLY_ROW = { format: sinon.stub().returns('translation for only one row') };
      });

      renderPagerWithOptions({
        startIndex: 9,
        endIndex: 10,
        datasetRowCount: 10
      });

      verifyPagerLabelText('translation for only one row');

      it('should format the translation with the correct parameters', function() {
        sinon.assert.alwaysCalledWithExactly(
          vif.configuration.localization.ONLY_ROW.format,
          {
            unitOne: 'case',
            unitOther: 'cases',
            firstRowOrdinal: '10',
            lastRowOrdinal: '10',
            datasetRowCount: '10'
          }
        );
      });
    });

    describe('with a page size of 10', function() {
      beforeEach(function() {
        vif.configuration.localization.MANY_ROWS = { format: sinon.stub().returns('translation for many rows') };
      });

      renderPagerWithOptions({
        startIndex: 0,
        endIndex: 9,
        datasetRowCount: 10
      });

      verifyPagerLabelText('translation for many rows');

      it('should format the translation with the correct parameters', function() {
        sinon.assert.alwaysCalledWithExactly(
          vif.configuration.localization.MANY_ROWS.format,
          {
            unitOne: 'case',
            unitOther: 'cases',
            firstRowOrdinal: '1',
            lastRowOrdinal: '9',
            datasetRowCount: '10'
          }
        );
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

  function verifyPagerLabelText(text) {
    it('should have text: {0}'.format(text), function() {
      assert.equal(
        pagerLabel.text(),
        text
      );
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
