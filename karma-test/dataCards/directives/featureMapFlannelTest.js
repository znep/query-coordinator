describe('feature map flannel', function() {
  'use strict';

  var scope;
  var compile;
  var testHelpers;
  var rootScope;
  var element;
  var I18n;
  var Constants;

  var ERROR_MESSAGE;

  var MOCK_QUERY_RESPONSES = [createRow(1), createRow(2), createRow(3)];

  // Returns a mock row with its 'Division Number' matching the row number
  function createRow(rowNumber) {
    return [
      { columnName: 'Division Number',
        format: {},
        isCurrentColumn: false,
        physicalDataType: 'number',
        value: rowNumber
      },
      { columnName: 'Headquarters',
        format: {},
        isCurrentColumn: true,
        physicalDataType: 'point',
        value: [{
          coordinates: [-89.115646, 32.911919],
          type: 'point'
        }]
      },
      { columnName: 'Commanding Officer',
        format: {},
        isCurrentColumn: false,
        physicalDataType: 'text',
        value: 'Brad Hentley'
      }
    ];
  }

  // Creates a mock feature map flannel
  function createFeatureMapFlannel() {
    scope = rootScope.$new();
    var html = '<feature-map-flannel></feature-map-flannel>';

    scope.queryStatus = Constants.QUERY_PENDING;
    scope.busy = true;

    element = testHelpers.TestDom.compileAndAppend(html, scope);
  }

  // Complete set up
  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module('/angular_templates/dataCards/featureMapFlannel.html'));

  beforeEach(inject(function($injector) {
    compile = $injector.get('$compile');
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    I18n = $injector.get('I18n');
    Constants = $injector.get('Constants');
  }));

  beforeEach(function() {
    createFeatureMapFlannel();
    ERROR_MESSAGE = I18n.t('featureMapFlannel.errorMessage');
  });

  describe('content dependant on query status', function() {
    it('should have pending status by default', function() {
      expect(element.find('.pending-content')).to.have.length(1);
      expect(element.find('.spinner')).to.have.class('busy');
    });

    it('should show error message when invalid query response received', function() {
      scope.queryStatus = Constants.QUERY_ERROR;
      scope.$digest();
      expect(element.find('.error-content')).to.have.length(1);
      expect(element.find('.error-message')).to.contain(ERROR_MESSAGE);
    });

    it('should show query data when a query succeeds and returns a valid response', function() {
      scope.rows = MOCK_QUERY_RESPONSES;
      scope.queryStatus = Constants.QUERY_SUCCESS;
      scope.$digest();
      expect(element.find('.flannel-content')).to.have.length(1);
    });
  });

  describe('one row of data returned from successful query', function() {
    beforeEach(function() {
      scope.rows = MOCK_QUERY_RESPONSES.slice(0, 1);
      scope.queryStatus = Constants.QUERY_SUCCESS;
      scope.$digest();
    });

    it('should not have paging controls if only one row is returned from query', function() {
      expect(element.find('.paging-panel-wrapper')).to.have.length(0);
    });

    it('should have three cells of data displayed on the flannel', function() {
      expect(element.find('.row-data-item')).to.have.length(3);
    });
  });

  describe('multiple rows of data returned from query', function() {
    beforeEach(function() {
      scope.rows = MOCK_QUERY_RESPONSES;
      scope.queryStatus = Constants.QUERY_SUCCESS;
      scope.$digest();
    });

    it('should have paging controls if more than one row is included in query results', function() {
      expect(element.find('.paging-panel-wrapper')).to.have.length(1);
    });

    it('should should contain all three cells of data on the displayed page for the given row', function() {
      expect(element.find('.row-data-item')).to.have.length(3);
    });

    describe('pagination control', function() {
      var nextButton;
      var previousButton;

      function executeClick(button, numberOfClicks) {
        _.times(numberOfClicks, function() {
          button.click();
          scope.$digest();
        });
      }

      beforeEach(function() {
        nextButton = element.find('.next');
        previousButton = element.find('.previous');
      });

      describe('page forward', function() {
        // When on row n, row data will list 'Division Number: n'
        it('should display row 1 on page 1 of 3 and have a disabled previous button and functional next button', function() {
          expect(element.find('.value').eq(0).text()).to.equal('1');
          expect(previousButton.is(':disabled')).to.be.true;
          expect(nextButton.is(':disabled')).to.be.false;
        });

        it('should display row 2 on page 2 of 3 and have both buttons functioning', function() {
          executeClick(nextButton, 1);
          expect(element.find('.value').eq(0).text()).to.equal('2');
          expect(previousButton.is(':disabled')).to.be.false;
          expect(nextButton.is(':disabled')).to.be.false;
        });

        it('should display row 3 on page 3 of 3 and have a functioning previous button and disabled next button', function() {
          executeClick(nextButton, 2);
          expect(element.find('.value').eq(0).text()).to.equal('3');
          expect(previousButton.is(':disabled')).to.be.false;
          expect(nextButton.is(':disabled')).to.be.true;
        });
      });

      describe('page backward', function() {
        beforeEach(function() {
          // page to last page (3 of 3)
          executeClick(nextButton, 2);
        });

        it('should display row 3 on page 3 of 3, and have a functioning previous button and disabled next button', function() {
          expect(element.find('.value').eq(0).text()).to.equal('3');
          expect(previousButton.is(':disabled')).to.be.false;
          expect(nextButton.is(':disabled')).to.be.true;
        });

        it('should display row 2 on page 2 of 3 and have both buttons functioning', function() {
          executeClick(previousButton, 1);
          expect(element.find('.value').eq(0).text()).to.equal('2');
          expect(previousButton.is(':disabled')).to.be.false;
          expect(nextButton.is(':disabled')).to.be.false;
        });

        it('should display row 1 on page 1 of 3 and have a disabled previous button and functional next button', function() {
          executeClick(previousButton, 2);
          expect(element.find('.value').eq(0).text()).to.equal('1');
          expect(previousButton.is(':disabled')).to.be.true;
          expect(nextButton.is(':disabled')).to.be.false;
        });
      });
    });
  });
});
