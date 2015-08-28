(function() {

  'use strict';

  describe('socrata.visualizations.rowInspector', function() {
    var $dom;
    var $rowInspector;
    var $toolPanel;

    var validData = _.map(_.range(1, 10), function(rowIndex) {
      return _.map(_.range(1, 10), function(columnIndex) {
        return {
          column: 'row {0} col {1}'.format(rowIndex, columnIndex),
          value: _.uniqueId('row value ')
        }
      });
    });

    before(function(done) {
      $.get('/base/socrata.visualizations.rowInspector.html').
        then(function(htmlString) {
          $dom = $('<div>', { id: 'row-inspector-test-div' }).html(htmlString);
          $('body').append($dom);
          $rowInspector = $dom.find('#socrata-row-inspector');
          $toolPanel = $rowInspector.find('.tool-panel');
          done();
        });
    });

    after(function() {
      $dom.remove();
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
        $rowInspector.find('.icon-close').trigger({ type: 'click',  which: 1 });
        assert.isFalse($rowInspector.hasClass('visible'));
      });

      it('should close when the user clicks outside the rowInspector', function() {
         $dom.trigger({ type: 'click',  which: 1 });
         assert.isFalse($rowInspector.hasClass('visible'));
      });

      it('should not close when something in the rowInspector other than the x is clicked', function() {
         $rowInspector.trigger({ type: 'click',  which: 1 });
         assert.isTrue($rowInspector.hasClass('visible'));
      });
    }

    function runTestCasesAndAssertTranslations(i18nStrings) {
      it('should apply the correct translations to the html', function() {
        assert.equal($dom.find('.pagination-btn.previous').text().trim(), i18nStrings.previous);
        assert.equal($dom.find('.pagination-btn.next').text().trim(), i18nStrings.next);
      });

      describe('When given SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', function() {
        var showEventPayload = {
          position: { pageX: 10, pageY: 200 },
          error: false
        };

        beforeEach(function(done) {
          $dom.trigger('SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', showEventPayload);
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
            $dom.trigger('SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDE');
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
                $dom.trigger('SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE', payload);
              });
            });
          }

          describe('that has badly-formed data', function() {
            verifyThrowsWithInvalidPayload(_.extend({}, validUpdatePayload, { data: {} }));
            verifyThrowsWithInvalidPayload(_.extend({}, validUpdatePayload, { data: [ { column: 'c', value: '' } ] }));
            verifyThrowsWithInvalidPayload(_.extend({}, validUpdatePayload, { data: [ [ { bad: true } ] ] }));
          });

          describe('that is valid', function() {
            beforeEach(function(done) {
              $dom.trigger('SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE', validUpdatePayload);
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
              assert.equal($names.text(), _.pluck(validData[0], 'column').join(''));
              assert.equal($values.text(), _.pluck(validData[0], 'value').join(''));
              assert.equal($rowInspector.find('.paging-info .message div:first-child').text(), 'Showing Row');
            });
          });
        });
      });
    }

    describe('setup', function() {
      describe('given no params', function() {
        var i18nStrings = {
          previous: 'Previous',
          next: 'Next'
        };

        beforeEach(function() {
          window.socrata.visualizations.rowInspector.setup();
        });

        runTestCasesAndAssertTranslations(i18nStrings);
      });

      describe('given a configuration object', function() {
        describe('with i18n strings', function() {
          var i18nStrings = {
            previous: 'something resembling a previous button',
            next: 'a next button'
          };

          beforeEach(function() {
            window.socrata.visualizations.rowInspector.setup({
              localization: i18nStrings
            });
          });

          runTestCasesAndAssertTranslations(i18nStrings);
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
          $dom.trigger('SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', payload);
          _.defer(done);
        });
      }

      function verifyStickyBorderBottomPosition(isPaged) {
        it('should hide the stick border on the bottom', function() {
          var expectedBottom = isPaged ? $rowInspector.find('.paging-panel').height() : 0;
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
      beforeEach(function() {
        $hint = $rowInspector.find('.tool-panel-hint');
      });

      function showAtXPosition(x) {
        var showEventPayload = {
          position: { pageX: x, pageY: 200 },
          error: false
        };

        beforeEach(function(done) {
          $dom.trigger('SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', showEventPayload);
          _.defer(done);
        });
      }

      describe('when shown at the right edge of the screen', function() {
        showAtXPosition($(window).width());
        it('should stick to the right side of the screen', function() {
          // ROW_INSPECTOR_WIDTH + ROW_INSPECTOR_PADDING_COMPENSATION + ROW_INSPECTOR_WINDOW_PADDING
          var expectedRight = 350 + 3 + 22;

          assert.include($toolPanel.attr('style'), 'right: {0}px'.format(expectedRight));
        });

        it('should display the hint at the extreme right of the rowInspector', function() {
          assert.include($hint.attr('style'), 'right: 0');
        });

        it('should display a southeast hint', function() {
          assert.lengthOf($rowInspector.find('.tool-panel.southeast'), 1);
        });
      });

      describe('when shown 50px from the right edge of the screen', function() {
        showAtXPosition($(window).width() - 50);
        it('should stick to the right side of the screen', function() {
          // ROW_INSPECTOR_WIDTH + ROW_INSPECTOR_PADDING_COMPENSATION + ROW_INSPECTOR_WINDOW_PADDING
          var expectedRight = 350 + 3 + 22;

          assert.include($toolPanel.attr('style'), 'right: {0}px'.format(expectedRight));
        });

        it('should display the hint at the mouse X position', function() {
          var expectedRight = $(window).width() - (($(window).width() - 50) + 22)

          assert.include($hint.attr('style'), 'right: {0}px'.format(expectedRight));
        });

        it('should display a southeast hint', function() {
          assert.lengthOf($rowInspector.find('.tool-panel.southeast'), 1);
        });
      });

      describe('when shown 275px from the right edge of the screen', function() {
        showAtXPosition($(window).width() - 275);
        it('should stick to the right side of the screen', function() {
          // ROW_INSPECTOR_WIDTH + ROW_INSPECTOR_PADDING_COMPENSATION + ROW_INSPECTOR_WINDOW_PADDING
          var expectedRight = 350 + 3 + 22;

          assert.include($toolPanel.attr('style'), 'right: {0}px'.format(expectedRight));
        });

        it('should display the hint at the mouse X position', function() {
          var ROW_INSPECTOR_HINT_WIDTH = 10;
          var expectedRight = $(window).width() - (($(window).width() - 275) + 22) - ROW_INSPECTOR_HINT_WIDTH;

          assert.include($hint.attr('style'), 'right: {0}px'.format(expectedRight));
        });

        it('should display a southwest hint', function() {
          assert.lengthOf($rowInspector.find('.tool-panel.southwest'), 1);
        });
      });

      describe('when shown at the left edge of the screen', function() {
        showAtXPosition(0);
        it('should stick to the left side of the screen', function() {
          assert.include($toolPanel.attr('style'), 'left: 0');
        });

        it('should display the hint at the extreme left of the rowInspector', function() {
          // We can't load scss in these tests.
          // Without a style attr attached, the hint will
          // show up at the left by default.
          assert.equal($hint.attr('style'), '');
        });

        it('should display a southwest hint', function() {
          assert.lengthOf($rowInspector.find('.tool-panel.southwest'), 1);
        });
      });
    });

    describe('When given SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', function() {
      var errorPayload = {
        position: { pageX: 10, pageY: 200 },
        error: true,
        message: 'lol fail'
      };

      beforeEach(function(done) {
        $dom.trigger('SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', errorPayload);
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

})();
