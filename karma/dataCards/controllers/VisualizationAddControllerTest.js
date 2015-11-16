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
  var validColumnName = 'foo';

  // If the tests aren't running in an iframe, these tests
  // aren't easy to write (as window.frameElement isn't
  // writeable in all browsers).
  // Fortunately, tests run in an iframe in most cases.
  //
  // Unfortunately, the one exception is when a dev is running tests
  // in debug mode. We have made the tests that won't pass conditionally
  // xdescribe for now. If you need to actually test something in the
  // conditionally xdescribe'd tests, simply change the possiblyDescribe
  // declaration and assignment a few lines below.
  var canRunParentWindowTests = !!(window.frameElement);
  if (!canRunParentWindowTests) {
    console.warn('WARNING: disabling some VisualizationAddController tests because test run is not in an iframe');
  }
  var possiblyDescribe = canRunParentWindowTests ? describe : xdescribe;

  function emitCardModelSelected(payload) {
    $scope.$emit('card-model-selected', payload);
    $scope.$apply();
  }

  function emitRelatedVisualizationSelected(payload) {
    $scope.$emit('related-visualization-selected', payload);
    $scope.$apply();
  }

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
        }
      ]
    )
  );

  beforeEach(function() {
    window.relatedVisualizations = [];
  });

  afterEach(function() {
    delete window.relatedVisualizations;
  });

  function makeContext(overrides) {
    validVIF = {
      aggregation: {
        field: null,
        'function': 'count'
      },
      columnName: validColumnName,
      datasetUid: 'asdf-fdsa',
      description: 'yar',
      type: 'columnChart'
    };

    serializedDataset = { columns: {} };
    serializedDataset.columns[validColumnName] = {
      availableCardTypes: ['column'],
      description: validVIF.description,
      name: 'name'
    };

    var columns = {};
    columns[validColumnName] = {
      name: validColumnName,
      physicalDatatype: 'number',
      defaultCardType: 'column',
      availableCardTypes: [ 'column' ]
    };

    var dataset = Mockumentary.createDataset({
      columns: columns
    });
    dataset.serialize = _.constant(serializedDataset);

    var $scope = $rootScope.$new();

    return {
      $scope: $scope,
      dataset: dataset,
      defaultColumn: _.get(overrides, 'defaultColumn', undefined),
      defaultRelatedVisualizationUid: _.get(overrides, 'defaultRelatedVisualizationUid', undefined)
    };
  }

  function makeController(options) {
    var context = makeContext(options);
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

    it('should set relatedVisualizations to window.relatedVisualizations', function() {
      $scope = controllerHarness.$scope;

      expect($scope.relatedVisualizations).to.
        equal(window.relatedVisualizations);
    });
  });

  possiblyDescribe('with valid onVisualizationSelected function', function() {
    beforeEach(function() {
      window.frameElement.onVisualizationSelected = sinon.spy();
    });
    afterEach(function() {
      delete window.frameElement.onVisualizationSelected;
    });


    describe('related-visualization-selected scope event', function() {
      var relatedVisualizationVIF = {
        type: 'test',
        columnName: 'thisWasPresumablySavedFromADataLens',
        origin: {
          type: 'unit tests'
        },
        filters: [
          {
            'function': 'BinaryOperator',
            'arguments': {
              'operand': true,
              'operator': '='
            },
            columnName: 'tinymonster_6'
          }
        ]
      };

      describe('with a valid VIF and an originalUid', function() {
        beforeEach(function() {
          var relatedVisualizationPageMetadata = Mockumentary.createPageMetadata();
          relatedVisualizationPageMetadata.sourceVif = relatedVisualizationVIF;
          emitRelatedVisualizationSelected({
            format: 'page_metadata',
            data: relatedVisualizationPageMetadata,
            originalUid: 'viff-vizz'
          });
        });

        it('should call onVisualizationSelected with the original VIF', function() {
          sinon.assert.calledOnce(window.frameElement.onVisualizationSelected);
          sinon.assert.calledWithExactly(
            window.frameElement.onVisualizationSelected,
            relatedVisualizationVIF,
            'vif',
            'viff-vizz'
          );
        });
      });

      describe('with a valid VIF but no originalUid', function() {
        var resultantWhereClause = '`tinymonster_6`=true';

        beforeEach(function() {
          var relatedVisualizationPageMetadata = Mockumentary.createPageMetadata();
          relatedVisualizationPageMetadata.sourceVif = relatedVisualizationVIF;
          emitRelatedVisualizationSelected({format: 'page_metadata', data: relatedVisualizationPageMetadata});
        });

        it('should call onVisualizationSelected with the original VIF', function() {
          sinon.assert.calledOnce(window.frameElement.onVisualizationSelected);
          sinon.assert.calledWithExactly(
            window.frameElement.onVisualizationSelected,
            relatedVisualizationVIF,
            'vif',
            undefined // no originalUid
          );
        });

        it('should set addCardSelectedColumnFieldName to the VIF\'s columnName', function() {
          expect($scope.addCardSelectedColumnFieldName).to.equal(relatedVisualizationVIF.columnName);
        });

        it('should set scope.page to a Page instance with the VIF set', function(done) {
          // We have no direct way of querying a Page for its source VIF, but we can test
          // computedWhereClauseFragment, which is computed from the VIF.
          $scope.page.observe('computedWhereClauseFragment').subscribe(function(fragment) {
            expect(fragment).to.equal(resultantWhereClause);
            done();
          });
        });

        it('should set scope.whereClause to match the VIF filters key', function(done) {
          $scope.$observe('whereClause').subscribe(function(whereClause) {
            // whereClause starts out blank; the next digest brings it to the correct value.
            if (whereClause.length > 0) {
              expect(whereClause).to.equal(resultantWhereClause);
              done();
            }
          });
        });
      });

      describe('with a valid classic visualization with no originalUid', function() {
        var relatedVisualization = {
          format: 'classic',
          data: {}
        };

        it('should throw', function() {
          expect(function() {
            emitRelatedVisualizationSelected(relatedVisualization);
          }).to.throw();
        });
      });

      describe('with a valid classic visualization with an originalUid', function() {
        var relatedVisualizationData = {
          something: 'something'
        };

        var relatedVisualization = {
          format: 'classic',
          data: relatedVisualizationData,
          originalUid: 'oldd-vizz'
        };

        beforeEach(function() {
          emitRelatedVisualizationSelected(relatedVisualization);
        });

        it('should call onVisualizationSelected with the original data and originalUid', function() {
          sinon.assert.calledOnce(window.frameElement.onVisualizationSelected);
          sinon.assert.calledWithExactly(
            window.frameElement.onVisualizationSelected,
            relatedVisualizationData,
            'classic',
            'oldd-vizz'
          );
        });

        it('should set addCardSelectedColumnFieldName to null', function() {
          expect($scope.addCardSelectedColumnFieldName).to.equal(null);
        });

        it('should set classicVisualization', function() {
          expect($scope.classicVisualization).to.equal(relatedVisualization);
        });
      });
    });

    describe('card-model-selected scope event', function() {

      describe('with a null payload', function() {
        it('should call onVisualizationSelected with null', function() {
          emitCardModelSelected(null);
          sinon.assert.calledOnce(window.frameElement.onVisualizationSelected);
          sinon.assert.calledWith(window.frameElement.onVisualizationSelected, null);
        });
      });

      describe('with a non-null payload', function() {
        beforeEach(function() {
          var cardSelected = {
            fieldName: validVIF.columnName
          };

          emitCardModelSelected(cardSelected);
        });

        it('should call onVisualizationSelected with the results of VIF synthesis in the payload', function() {
          sinon.assert.calledOnce(window.frameElement.onVisualizationSelected);
          sinon.assert.calledWithMatch(window.frameElement.onVisualizationSelected, validVIF);
        });
      });
    });
  });

  possiblyDescribe('default visualization options', function() {
    function controllerHarnessWithDefaultColumn(column) {
      return makeController({
        defaultColumn: column,
      });
    }
    function controllerHarnessWithDefaultRelatedViz(uid) {
      return makeController({
        defaultRelatedVisualizationUid: uid
      });
    }

    describe('with only defaultColumn specified', function() {

      // To see why these tests are async, see the apologetic comment regarding the setTimeout
      // in VisualizationAddController.
      describe('which is valid', function() {
        it('should set addCardSelectedColumnFieldName to the value of defaultColumn', function(done) {
          controllerHarnessWithDefaultColumn(validColumnName).
            $scope.$observe('addCardSelectedColumnFieldName').
            subscribe(function(fieldName) {
              if(fieldName) {
                expect(fieldName).to.equal(validColumnName);
               done();
              }
            });
        });
      });

      describe('which is not valid', function() {
        it('should set addCardSelectedColumnFieldName to null', function(done) {
          controllerHarnessWithDefaultColumn('notAValidColumn').
            $scope.$observe('addCardSelectedColumnFieldName').
            subscribe(function(fieldName) {
              expect(fieldName).to.equal(null);
               done();
            });
        });
      });
    });

    describe('with only defaultRelatedVisualizationUid specified', function() {
      beforeEach(function() {
        window.relatedVisualizations = [
          {
            originalUid: 'corr-ectt'
          }
        ];
      });

      describe('which is valid', function() {
        it('should emit related-visualization-selected with the matching related visualization', function(done) {
          $rootScope.$on('related-visualization-selected', function(event, payload) {
            expect(payload).to.equal(window.relatedVisualizations[0]);
            done();
          });
          controllerHarnessWithDefaultRelatedViz('corr-ectt');
        });
      });

      describe('which is not valid', function() {
        it('should not emit related-visualization-selected', function() {
          $rootScope.$on('related-visualization-selected', function() {
            throw new Error('should not get here');
          });
          controllerHarnessWithDefaultRelatedViz('wron-ggg');
        });
      });
    });

    describe('with both defaultColumn and defaultRelatedVisualizationUid specified', function() {
      beforeEach(function() {
        window.relatedVisualizations = [
          {
            originalUid: 'corr-ectt'
          }
        ];
      });

      it('should emit related-visualization-selected with the matching related visualization', function(done) {
        $rootScope.$on('related-visualization-selected', function(event, payload) {
          expect(payload).to.equal(window.relatedVisualizations[0]);
          done();
        });
        makeController({
          defaultRelatedVisualizationUid: 'corr-ectt',
          defaultColumn: validColumnName
        });
      });
    });
  });

  possiblyDescribe('with no or invalid onVisualizationSelected function', function() {
    it('should trigger an error on card-model-selected', function() {
      expect(function() {
        emitCardModelSelected(null);
      }).to.throw(/onVisualizationSelected/);

      window.frameElement.onVisualizationSelected = 'notAFunction';
      expect(function() {
        emitCardModelSelected(null);
      }).to.throw(/onVisualizationSelected/);
    });

  });
});
