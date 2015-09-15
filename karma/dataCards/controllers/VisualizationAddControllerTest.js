describe('VisualizationAddController', function() {
  'use strict';

  var Page;
  var Dataset;
  var Mockumentary;
  var testHelpers;
  var $rootScope;
  var $controller;
  var controllerHarness;
  var $scope;
  var validVIF;
  var serializedDataset;

  beforeEach(module('dataCards'));

  beforeEach(
    inject(
      [
        'Page',
        'Dataset',
        'Mockumentary',
        '$rootScope',
        '$controller',
        'testHelpers',
        function(
          _Page,
          _Dataset,
          _Mockumentary,
          _$rootScope,
          _$controller,
          _testHelpers) {

      Page = _Page;
      Dataset = _Dataset;
      Mockumentary = _Mockumentary;
      $rootScope = _$rootScope;
      $controller = _$controller;
      testHelpers = _testHelpers;
  }]));

  function makeContext(datasetOverrides) {
    if (datasetOverrides && datasetOverrides.id) {
      pageOverrides.datasetId = datasetOverrides.id;
    }

    validVIF = {
      aggregation: {
        field: null,
        'function': 'count'
      },
      columnName: 'foo',
      datasetUid: 'asdf-fdsa',
      description: 'yar',
      type: 'columnChart'
    };

    serializedDataset = { columns: {} };
    serializedDataset.columns[validVIF.columnName] = {
      availableCardTypes: ['column'],
      description: validVIF.description,
      name: 'name'
    };

    var dataset = Mockumentary.createDataset(datasetOverrides);
    dataset.serialize = _.constant(serializedDataset);

    var $scope = $rootScope.$new();

    return {
      $scope: $scope,
      dataset: dataset
    };
  }

  function makeController(datasetOverrides) {
    var context = makeContext(datasetOverrides);
    var controller = $controller('VisualizationAddController', context);
    context.$scope.$apply();

    return $.extend(context, {
      controller: controller
    });
  }

  beforeEach(function(){
    controllerHarness = makeController();
    $scope = controllerHarness.$scope;
  });

  describe('scope', function() {
    it('should contain a valid Page for compatibility', function() {
      expect($scope.page).to.be.instanceof(Page);
      expect($scope.page.getCurrentValue('dataset')).to.equal($scope.dataset);
    });
    it('should contain a valid Dataset', function() {
      expect($scope.dataset).to.be.instanceof(Dataset);
    });
  });

  describe('card-model-selected scope event', function() {
    function emitCardModelSelected(payload) {
      $scope.$emit('card-model-selected', payload);
    }

    // This isn't easy to test as window.parent isn't
    // writeable in all browsers.
    // Disabling the test for now - this functionality is
    // for developer convenience only.
    xdescribe('with no parent window', function() {
      var originalParent;
      beforeEach(function() {
        originalParent = window.parent;
        window.parent = undefined;
      });
      afterEach(function() {
        window.parent = originalParent;
      });

      it('should trigger an error', function() {
        expect(function() {
          emitCardModelSelected(null);
        }).to.throw(/on the iframe/);
      });
    });

    // If the tests aren't running in an iframe, these tests
    // aren't easy to write (as window.frameElement isn't
    // writeable in all browsers).
    // Fortunately, tests run in an iframe in most cases.
    // Unfortunately, the one exception is when a dev is running tests
    // in debug mode...
    var canRunParentWindowTests = !!(window.frameElement);
    if (!canRunParentWindowTests) {
      console.warn('WARNING: disabling some VisualizationAddController tests because test run is not in an iframe');
    }

    (canRunParentWindowTests ? describe : xdescribe)('with a parent window', function() {
      describe('but with no or invalid onVisualizationSelected function', function() {
        it('should trigger an error', function() {
          expect(function() {
            emitCardModelSelected(null);
          }).to.throw(/onVisualizationSelected/);

          window.frameElement.onVisualizationSelected = 'notAFunction';
          expect(function() {
            emitCardModelSelected(null);
          }).to.throw(/onVisualizationSelected/);
        });

        describe('with valid onVisualizationSelected function', function() {
          beforeEach(function() {
            window.frameElement.onVisualizationSelected = sinon.spy();
          });
          afterEach(function() {
            delete window.frameElement.onVisualizationSelected;
          });

          describe('with a null payload', function() {
            it('should call onVisualizationSelected with null', function() {
              emitCardModelSelected(null);
              sinon.assert.calledOnce(window.frameElement.onVisualizationSelected);
              sinon.assert.calledWith(window.frameElement.onVisualizationSelected, null);
            });
          });

          describe('with a non-null payload', function() {
            it('should call onVisualizationSelected with the results of VIF synthesis in the payload', function() {
              var cardSelected = {
                fieldName: validVIF.columnName
              };

              emitCardModelSelected(cardSelected);

              sinon.assert.calledOnce(window.frameElement.onVisualizationSelected);
              sinon.assert.calledWithMatch(window.frameElement.onVisualizationSelected, validVIF);
            });
          });
        });
      });
    });
  });
});
