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
    var dataset = Mockumentary.createDataset(datasetOverrides);

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

    describe('with no parent window', function() {
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

    describe('with a parent window', function() {
      describe('but with no or invalid onVisualizationSelected function', function() {
        it('should trigger an error', function() {
          expect(function() {
            emitCardModelSelected(null);
          }).to.throw(/onVisualizationSelected/);

          window.frameElement = 'notAFunction';
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
            it('should call onVisualizationSelected with the results of serialize() on the payload', function() {
              var expectedArgument = { foo: 'bar' };

              emitCardModelSelected({
                serialize: _.constant(expectedArgument)
              });

              sinon.assert.calledOnce(window.frameElement.onVisualizationSelected);
              sinon.assert.calledWith(window.frameElement.onVisualizationSelected, expectedArgument);
            });
          });
        });
      });
    });
  });
});
