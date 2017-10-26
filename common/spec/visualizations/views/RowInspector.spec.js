var _ = require('lodash');
var $ = require('jquery');
var RowInspector = require('common/visualizations/views/RowInspector');
var I18n = require('common/i18n').default;
var allLocales = require('common/i18n/config/locales').default;

describe('RowInspector', function() {
  'use strict';

  var $rowInspector;
  var $toolPanel;

  var validData = _.map(_.range(1, 10), function(rowIndex) {
    return _.map(_.range(1, 10), function(columnIndex) {
      return {
        column: 'row {0} col {1}'.format(rowIndex, columnIndex),
        value: _.uniqueId('row value ')
      };
    });
  });

  function triggerCustomEvent(eventName, detail) {
    $('body').trigger(
      eventName,
      detail
    );
  }

  before(function() {
    I18n.translations.en = allLocales.en;
    RowInspector.setup({ isMobile: false }, null);
    $rowInspector = $('#socrata-row-inspector');
    $toolPanel = $rowInspector.find('.tool-panel');
  });

  after(function() {
    $('#socrata-row-inspector').remove();
    I18n.translations = {};
  });

  afterEach(function() {
    var relevantEvents = [
      'SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW',
      'SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE',
      'SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDE'
    ];

    _.each(relevantEvents, function(eventName) {
      var registeredListenerCount = $._data(document.body, 'events')[eventName].length;
      assert.equal(
        registeredListenerCount,
        1,
        'Expected only one listener to ever be attached for: {0}'.format(eventName)
      );
    });
  });

  function verifyCloseBehavior() {
    it('should close when the x is clicked', function() {
      $rowInspector.find('.icon-close').trigger({ type: 'click', which: 1 });
      assert.isFalse($rowInspector.hasClass('visible'));
    });

    it('should close when the user clicks outside the rowInspector', function() {
      $('body').trigger({ type: 'click', which: 1 });
      assert.isFalse($rowInspector.hasClass('visible'));
    });

    it('should not close when something in the rowInspector other than the x is clicked', function() {
      $rowInspector.trigger({ type: 'click', which: 1 });
      assert.isTrue($rowInspector.hasClass('visible'));
    });
  }

  function runTestCases() {
    it('should apply the correct translations to the html', function() {
      assert.equal($rowInspector.find('.paging-btn.previous').text().trim(), 'Previous');
      assert.equal($rowInspector.find('.paging-btn.next').text().trim(), 'Next');
    });

    describe('When given SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', function() {
      var showEventPayload = {
        position: { pageX: 10, pageY: 200 },
        error: false
      };

      beforeEach(function(done) {
        triggerCustomEvent('SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', showEventPayload);
        _.defer(done);
      });

      it('should become visible', function() {
        assert.isTrue($rowInspector.hasClass('visible'));
      });

      it('should show the spinner', function() {
        assert.isTrue($rowInspector.find('.pending-content').hasClass('visible'));
      });

      it('should be placed at the page coordinates specified in the event payload', function() {
        assert.include($toolPanel.attr('style'), 'top: 200px');
        assert.include($toolPanel.attr('style'), 'left: 10px');
      });

      verifyCloseBehavior();

      describe('When given SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDE', function() {
        beforeEach(function() {
          triggerCustomEvent('SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDE');
        });

        it('should hide', function() {
          assert.isFalse($rowInspector.hasClass('visible'));
        });
      });

      describe('When given SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE', function() {
        var validUpdatePayload = {
          position: { pageX: 10, pageY: 200 },
          data: validData,
          error: false
        };

        function verifyThrowsWithInvalidPayload(payload) {
          it('should throw', function() {
            assert.throws(function() {
              triggerCustomEvent('SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE', payload);
            });
          });
        }

        describe('that has badly-formed data', function() {
          verifyThrowsWithInvalidPayload(_.extend({}, validUpdatePayload, { data: {} }));
          verifyThrowsWithInvalidPayload(_.extend({}, validUpdatePayload, { data: [{ column: 'c', value: '' }] }));
          verifyThrowsWithInvalidPayload(_.extend({}, validUpdatePayload, { data: [[{ bad: true }]] }));
        });

        describe('that is valid', function() {
          beforeEach(function(done) {
            triggerCustomEvent('SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE', validUpdatePayload);
            _.defer(done);
          });

          verifyCloseBehavior();

          it('rowInspector should be visible', function() {
            assert.isTrue($rowInspector.hasClass('visible'));
          });

          it('should hide the spinner', function() {
            assert.isFalse($rowInspector.find('.pending-content').hasClass('visible'));
          });

          it('should render the first page', function() {
            var $rowItems = $rowInspector.find('.row-data-item');
            var $names = $rowItems.find('.name');
            var $values = $rowItems.find('.value');

            assert.lengthOf($rowItems, validData[0].length);
            assert.equal($names.text(), _.map(validData[0], 'column').join(''));
            assert.equal($values.text(), _.map(validData[0], 'value').join(''));
            assert.equal($rowInspector.find('.paging-info .message div:first-child').text(), 'Showing Row');
          });

          it('should not render a title if none provided', function() {
            var $title = $rowInspector.find('.row-inspector-title');
            assert.lengthOf($title, 0);
          });

          it('should render a title if one is provided', function(done) {
            validUpdatePayload.titles = ['Wombats in Space'];
            triggerCustomEvent('SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE', validUpdatePayload);
            _.defer(done);

            var $title = $rowInspector.find('.row-inspector-title');
            assert.lengthOf($title, 1);
          });
        });
      });
    });
  }

  describe('setup', function() {

    describe('given no params', function() {
      beforeEach(function() {
        RowInspector.setup();
      });

      runTestCases();
    });

    describe('given a configuration object', function() {
      describe('with i18n strings', function() {

        beforeEach(function() {
          RowInspector.setup();
        });

        runTestCases();
      });
    });
  });

  describe('paging', function() {
    var currentData;

    function verifyPreviousButtonEnabled() {
      it('should enable the previous button', function() {
        assert.isFalse($rowInspector.find('button.previous').prop('disabled'));
      });
    }

    function verifyPreviousButtonDisabled() {
      it('should disable the previous button', function() {
        assert.isTrue($rowInspector.find('button.previous').prop('disabled'));
      });
    }

    function verifyNextButtonEnabled() {
      it('should enable the next button', function() {
        assert.isFalse($rowInspector.find('button.next').prop('disabled'));
      });
    }

    function verifyNextButtonDisabled() {
      it('should disable the next button', function() {
        assert.isTrue($rowInspector.find('button.next').prop('disabled'));
      });
    }

    function verifyPagingPanelVisible() {
      it('should display the paging panel', function() {
        assert.lengthOf($rowInspector.find('.paging-panel.visible'), 1);
      });
    }

    function verifyPagingPanelHidden() {
      it('should hide the paging panel', function() {
        assert.lengthOf($rowInspector.find('.paging-panel.visible'), 0);
      });
    }

    function setNumberOfPages(numPages) {
      beforeEach(function(done) {
        var data = _.map(_.range(0, numPages), _.constant([{ column: 'foo', value: 'bar' }]));
        var payload = {
          position: { pageX: 10, pageY: 200 },
          error: false,
          data: data
        };

        currentData = data;
        triggerCustomEvent('SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', payload);
        _.defer(done);
      });
    }

    function verifyStickyBorderBottomPosition(isPaged) {
      it('should hide the sticky border on the bottom', function() {
        var expectedBottom = isPaged ? $rowInspector.find('.paging-panel').outerHeight() : 0;
        assert.include($rowInspector.find('.sticky-border.bottom').attr('style'), 'bottom: {0}px'.format(expectedBottom));
      });
    }

    function advancePageByAndVerifyMessage(pageDelta) {
      function verifyMessage(position, total) {
        assert.equal(
          $rowInspector.find('.paging-info .message div:first-child').text().trim(),
          'Showing Row'
        );
        assert.equal(
          $rowInspector.find('.paging-info .message div:last-child').text().trim(),
          '{0} of {1}'.format(position, total)
        );
      }

      beforeEach(function() {
        verifyMessage(1, currentData.length);
        _.range(0, pageDelta).forEach(function() {
          $rowInspector.find('button.next').click();
        });
        verifyMessage(pageDelta + 1, currentData.length);
      });
    }

    describe('with >=3 pages', function() {
      setNumberOfPages(10);
      verifyPagingPanelVisible();
      verifyStickyBorderBottomPosition(true);

      describe('at the first page', function() {
        verifyPreviousButtonDisabled();
        verifyNextButtonEnabled();
      });

      describe('at some page in the middle', function() {
        advancePageByAndVerifyMessage(3);
        verifyPreviousButtonEnabled();
        verifyNextButtonEnabled();
      });

      describe('at the last page', function() {
        advancePageByAndVerifyMessage(9);
        verifyPreviousButtonEnabled();
        verifyNextButtonDisabled();
      });
    });

    describe('with 2 pages', function() {
      setNumberOfPages(2);
      verifyPagingPanelVisible();
      verifyStickyBorderBottomPosition(true);

      describe('at the first page', function() {
        verifyPreviousButtonDisabled();
        verifyNextButtonEnabled();
      });

      describe('at the last page', function() {
        advancePageByAndVerifyMessage(1);
        verifyPreviousButtonEnabled();
        verifyNextButtonDisabled();
      });

    });

    describe('with 1 page', function() {
      setNumberOfPages(1);
      verifyPagingPanelHidden();
      verifyStickyBorderBottomPosition(false);
    });
  });

  describe('positioning', function() {
    var $hint;
    before(function() {
      $hint = $rowInspector.find('.tool-panel-hint');
    });

    function showAtXPosition(x) {
      var showEventPayload = {
        position: { pageX: x, pageY: 200 },
        error: false
      };

      beforeEach(function(done) {
        triggerCustomEvent('SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', showEventPayload);
        _.defer(done);
      });
    }

    function showAtYPosition(y) {
      var showEventPayload = {
        position: { pageX: 200, pageY: y },
        error: false
      };

      beforeEach(function(done) {
        triggerCustomEvent('SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', showEventPayload);
        _.defer(done);
      });
    }

    function distanceFromRightEdge() {
      // Look at tool-panel-main, as the root of the rowInspector does not actually have dimensions.
      var contentPosition = $toolPanel.find('.tool-panel-main')[0].getBoundingClientRect();
      var windowWidth = $(document.body).width();
      return windowWidth - contentPosition.right;
    }

    // TODO: Figure out why the three `xit`'d tests below are failing sometimes in
    // PhantomJS (and less often in Chrome):
    describe('east/west positioning', function() {
      describe('when shown at the right edge of the screen', function() {
        showAtXPosition($(window).width());
        it('should stick to the right side of the screen', function() {
          assert.isAbove(distanceFromRightEdge(), 0);
        });

        xit('should display the hint at the extreme right of the rowInspector', function() {
          assert.include($hint.attr('style'), 'right: 0');
        });

        xit('should display an east hint', function() {
          assert.lengthOf($rowInspector.find('.tool-panel.east'), 1);
        });
      });

      describe('when shown 50px from the right edge of the screen', function() {
        var xPositionShownAt = $(window).width() - 50;
        showAtXPosition(xPositionShownAt);
        it('should stick to the right side of the screen', function() {
          assert.isAbove(distanceFromRightEdge(), 0);
        });

        it('should display the hint at the mouse X position', function() {
          var distance = Math.abs(xPositionShownAt - $hint[0].getBoundingClientRect().right);
          assert.isBelow(distance, $hint.width());
        });

        xit('should display an east hint', function() {
          assert.lengthOf($rowInspector.find('.tool-panel.east'), 1);
        });
      });

      describe('when shown 275px from the right edge of the screen', function() {
        var xPositionShownAt = $(window).width() - 275;
        showAtXPosition(xPositionShownAt);
        it('should stick to the right side of the screen', function() {
          assert.isAbove(distanceFromRightEdge(), 0);
        });

        it('should display the hint at the mouse X position', function() {
          var distance = Math.abs(xPositionShownAt - $hint[0].getBoundingClientRect().left);
          assert.isBelow(distance, $hint.width());
        });

        it('should display a west hint', function() {
          assert.lengthOf($rowInspector.find('.tool-panel.west'), 1);
        });
      });

      describe('when shown at the left edge of the screen', function() {
        showAtXPosition(0);
        it('should stick to the left side of the screen', function() {
          assert.include($toolPanel.attr('style'), 'left: 0');
        });

        it('should display the hint at the extreme left of the rowInspector', function() {
          // The tip is somewhat oddly shaped, which confuses getBoundingClientRect sometimes.
          assert.isBelow($hint[0].getBoundingClientRect().left, 2);
        });

        it('should display a west hint', function() {
          assert.lengthOf($rowInspector.find('.tool-panel.west'), 1);
        });
      });
    });

    // TODO: Figure out why the `xit`'d test below also fails sometimes in
    // PhantomJS (and less often in Chrome):
    describe('north/south positioning', function() {
      xit('should position towards the bottom of the screen when above screen midpoint', function() {
        var yPositionShownAt = ($(window).height() - 10) / 2;
        showAtYPosition(yPositionShownAt);
        assert.lengthOf($rowInspector.find('.tool-panel.south'), 1);
      });

      xit('should position towards the top of the screen when below screen midpoint', function() {
        var yPositionShownAt = ($(window).height() + 10) / 2;
        showAtYPosition(yPositionShownAt);
        assert.lengthOf($rowInspector.find('.tool-panel.north'), 1);
      });
    });
  });

  describe('When given SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW with the error field set', function() {
    var errorPayload = {
      position: { pageX: 10, pageY: 200 },
      error: true,
      message: 'lol fail'
    };

    beforeEach(function(done) {
      triggerCustomEvent('SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', errorPayload);
      _.defer(done);
    });

    it('should become visible', function() {
      assert.isTrue($rowInspector.hasClass('visible'));
    });

    it('should hide the spinner', function() {
      assert.isFalse($rowInspector.find('.pending-content').hasClass('visible'));
    });

    it('should be placed at the page coordinates specified in the event payload', function() {
      assert.include($toolPanel.attr('style'), 'top: 200px');
      assert.include($toolPanel.attr('style'), 'left: 10px');
    });

    it('should display the error content', function() {
      var $errorContent = $rowInspector.find('.error-content');
      assert.isTrue($errorContent.hasClass('visible'));
      assert.equal($errorContent.find('.error-message').text().trim(), errorPayload.message);
    });

    verifyCloseBehavior();
  });
});
