(function() {
  'use strict';

  describe('Card Type Mapping Service', function() {

    var Model;
    var ServerConfig;
    var CardTypeMapping;
    var $exceptionHandler;

    beforeEach(module('dataCards'));

    beforeEach(module('dataCards.services'));

    beforeEach(module(function($exceptionHandlerProvider) {
      $exceptionHandlerProvider.mode('log');
    }));

    beforeEach(inject(function($injector) {
      Model = $injector.get('Model');
      ServerConfig = $injector.get('ServerConfig');
      var serverMocks = $injector.get('serverMocks');
      // We need to simulate the Feature Map feature flag being turned on
      // in order to test card type mappings to feature maps.
      ServerConfig.setup({
        'oduxEnableFeatureMap': true,
        'oduxCardTypeMapping': serverMocks.CARD_TYPE_MAPPING
      });
      CardTypeMapping = $injector.get('CardTypeMapping');
      $exceptionHandler = $injector.get('$exceptionHandler');
    }));

    function createHighCardinalityColumn(physicalDatatype) {
      var column = {
        physicalDatatype: physicalDatatype,
        cardinality: 1000
      };
      return column;
    }

    function createLowCardinalityColumn(physicalDatatype) {
      var column = {
        physicalDatatype: physicalDatatype,
        cardinality: 10
      };
      return column;
    }

    function overrideMap(map) {
      var mapping = {
        map: map,
        cardinality: {
          threshold: 35,
          min: 2
        }
      };
      ServerConfig.setup({
        oduxCardTypeMapping: mapping
      });
    }

    describe('availableVisualizationsForColumn', function() {
      describe('for a defined physical datatype', function() {
        describe('with only one visualization defined with no onlyIf conditions', function() {
          it('should return the single visualization', function() {
            overrideMap({ testPT: [ 'testViz' ] });
            expect(CardTypeMapping.availableVisualizationsForColumn(createLowCardinalityColumn('testPT'))).to.deep.equal(['testViz']);
          });
        });

        describe('with only one visualization defined with an onlyIf condition', function() {
          describe('that is invalid', function() {
            it('should throw', function() {
              overrideMap({
                testPT: [ 
                  {
                    type: 'testViz',
                    onlyIf: 'isNotACondition'
                  }
                ]
              });
              expect(function() {
                CardTypeMapping.availableVisualizationsForColumn(createLowCardinalityColumn('testPT'));
              }).to.throw();;
            });
          });
          describe('that is isLowCardinality', function() {
            var map = {
              testPT: [ 
                {
                  type: 'testViz',
                  onlyIf: 'isLowCardinality'
                }
              ]
            };
            describe('that evaluates to true', function() {
              it('should return the single visualization', function() {
                overrideMap(map);
                expect(CardTypeMapping.availableVisualizationsForColumn(createLowCardinalityColumn('testPT'))).to.deep.equal(['testViz']);
              });
            });
            describe('that evaluates to false', function() {
              it('should return an empty array', function() {
                overrideMap(map);
                expect(CardTypeMapping.availableVisualizationsForColumn(createHighCardinalityColumn('testPT'))).to.deep.equal([]);
              });
            });
          });
          describe('that is isHighCardinality', function() {
            var map = {
              testPT: [ 
                {
                  type: 'testViz',
                  onlyIf: 'isHighCardinality'
                }
              ]
            };
            describe('that evaluates to true', function() {
              it('should return the single visualization', function() {
                overrideMap(map);
                expect(CardTypeMapping.availableVisualizationsForColumn(createHighCardinalityColumn('testPT'))).to.deep.equal(['testViz']);
              });
            });
            describe('that evaluates to false', function() {
              it('should return an empty array', function() {
                overrideMap(map);
                expect(CardTypeMapping.availableVisualizationsForColumn(createLowCardinalityColumn('testPT'))).to.deep.equal([]);
              });
            });
          });
          describe('that is isGeoregionComputed', function() {
            var map = {
              testPT: [ 
                {
                  type: 'testViz',
                  onlyIf: 'isGeoregionComputed'
                }
              ]
            };
            describe('that evaluates to true', function() {
              it('should return the single visualization', function() {
                overrideMap(map);
                var geoColumnOnString = createLowCardinalityColumn('testPT');
                geoColumnOnString.computationStrategy = 'georegion_match_on_string';
                expect(CardTypeMapping.availableVisualizationsForColumn(geoColumnOnString)).to.deep.equal(['testViz']);

                var geoColumnOnPoint = createLowCardinalityColumn('testPT');
                geoColumnOnPoint.computationStrategy = 'georegion_match_on_point';
                expect(CardTypeMapping.availableVisualizationsForColumn(geoColumnOnPoint)).to.deep.equal(['testViz']);
              });
            });
            describe('that evaluates to false', function() {
              it('should return an empty array', function() {
                overrideMap(map);
                var nonComputedColumn = createLowCardinalityColumn('testPT');
                expect(CardTypeMapping.availableVisualizationsForColumn(nonComputedColumn)).to.deep.equal([]);

                var columnComputedInSomeOtherWay = createLowCardinalityColumn('testPT');
                columnComputedInSomeOtherWay.computationStrategy = 'some_magical_computation_strategy';
                expect(CardTypeMapping.availableVisualizationsForColumn(columnComputedInSomeOtherWay)).to.deep.equal([]);
              });
            });
          });
        });
        describe('with multiple defined visualizations', function() {
          describe('when all visualizations have no onlyIf', function() {
            it('should return all visualizations', function() {
              overrideMap({ testPT: [ 'testViz1', 'testViz2', { type: 'testViz3', defaultIf: 'isHighCardinality' } ] });
              expect(CardTypeMapping.availableVisualizationsForColumn(createLowCardinalityColumn('testPT'))).to.deep.equal(['testViz1', 'testViz2', 'testViz3']);
            });
          });
          describe('when only some visualizations have an onlyIf evaluating to true', function() {
            it('should return the visualizations which are not excluded', function() {
              overrideMap({ testPT: [
                'testViz1',
                { type: 'testViz2', onlyIf: 'isHighCardinality' },
                { type: 'testViz3', onlyIf: 'isLowCardinality' },
                { type: 'testViz4', defaultIf: 'isHighCardinality' }
              ]});
              expect(CardTypeMapping.availableVisualizationsForColumn(createLowCardinalityColumn('testPT'))).to.deep.equal(
                ['testViz1', 'testViz3', 'testViz4']
              );
            });
          });
          describe('when no visualizations have an onlyIf evaluating to true', function() {
            it('should return an empty array', function() {
              overrideMap({ testPT: [
                { type: 'testViz1', onlyIf: 'isHighCardinality' },
                { type: 'testViz2', onlyIf: 'isGeoregionComputed' }
              ]});
              expect(CardTypeMapping.availableVisualizationsForColumn(createLowCardinalityColumn('testPT'))).to.deep.equal([]);
            });
          });
        });

      });
      describe('for an undefined physical datatype', function() {
        it('should return an empty array', function() { // I'm unconvinced by this desired behavior, maybe it should throw?...
          overrideMap({ testPT: [ 'testViz' ] });
          expect(CardTypeMapping.availableVisualizationsForColumn(createLowCardinalityColumn('invalidDatatype'))).to.deep.equal([]);
        });
      });
    });

    describe('defaultVisualizationForColumn', function() {
      describe('for a defined physical datatype', function() {
        describe('with only one visualization defined with no defaultIf conditions', function() {
          it('should return the single visualization', function() {
            overrideMap({ testPT: [ 'testViz' ] });
            expect(CardTypeMapping.defaultVisualizationForColumn(createLowCardinalityColumn('testPT'))).to.equal('testViz');
          });
        });

        describe('with only one visualization defined with a defaultIf condition', function() {
          describe('that is invalid', function() {
            it('should throw', function() {
              overrideMap({
                testPT: [ 
                  {
                    type: 'testViz',
                    defaultIf: 'isNotACondition'
                  }
                ]
              });
              expect(function() {
                CardTypeMapping.defaultVisualizationForColumn(createLowCardinalityColumn('testPT'));
              }).to.throw();;
            });
          });
          // Assuming that other expressions work, as they are exercised in availableVisualizationsForColumn tests.
          describe('that is isLowCardinality', function() {
            var map = {
              testPT: [ 
                {
                  type: 'testViz',
                  defaultIf: 'isLowCardinality'
                }
              ]
            };
            describe('that evaluates to either true or false', function() {
              it('should return the single visualization', function() {
                overrideMap(map);
                expect(CardTypeMapping.defaultVisualizationForColumn(createLowCardinalityColumn('testPT'))).to.equal('testViz');;
                expect(CardTypeMapping.defaultVisualizationForColumn(createHighCardinalityColumn('testPT'))).to.equal('testViz');;
              });
            });
          });
        });
        describe('with multiple defined visualizations', function() {
          describe('when only some visualizations have an onlyIf evaluating to true', function() {
            it('should return the first visualization which is  not excluded', function() {
              overrideMap({ testPT: [
                { type: 'testViz1', onlyIf: 'isHighCardinality' },
                { type: 'testViz2', onlyIf: 'isHighCardinality' },
                { type: 'testViz3', onlyIf: 'isLowCardinality' },
                { type: 'testViz4', onlyIf: 'isLowCardinality' }
              ]});
              expect(CardTypeMapping.defaultVisualizationForColumn(createLowCardinalityColumn('testPT'))).to.equal('testViz3');
            });
          });
          describe('when no visualizations have an onlyIf evaluating to true', function() {
            it('should return undefined', function() {
              overrideMap({ testPT: [
                { type: 'testViz1', onlyIf: 'isHighCardinality' },
                { type: 'testViz2', onlyIf: 'isGeoregionComputed' }
              ]});
              expect(CardTypeMapping.defaultVisualizationForColumn(createLowCardinalityColumn('testPT'))).to.equal(undefined);
            });
          });
          describe('when faced with defaultIf expressions', function() {
            describe('when all visualizations have defaultIf evaluating to true', function() {
              describe('but some have onlyIf evaluating to false', function() {
                it('should return the first unexcluded visualization', function() {
                  overrideMap({ testPT: [
                    { type: 'testViz1', defaultIf: 'isLowCardinality', onlyIf: 'isHighCardinality'},
                    { type: 'testViz2', defaultIf: 'isLowCardinality' },
                    { type: 'testViz3', defaultIf: 'isGeoregionComputed' }
                  ]});
                  var lowCardinalityGeoColumnOnString = createLowCardinalityColumn('testPT');
                  lowCardinalityGeoColumnOnString.computationStrategy = 'georegion_match_on_string';

                  expect(CardTypeMapping.defaultVisualizationForColumn(lowCardinalityGeoColumnOnString)).to.equal('testViz2');
                });
              });

              it('should return the first visualization', function() {
                overrideMap({ testPT: [
                  { type: 'testViz1', defaultIf: 'isGeoregionComputed' },
                  { type: 'testViz2', defaultIf: 'isLowCardinality' }
                ]});
                var lowCardinalityGeoColumnOnString = createLowCardinalityColumn('testPT');
                lowCardinalityGeoColumnOnString.computationStrategy = 'georegion_match_on_string';

                expect(CardTypeMapping.defaultVisualizationForColumn(lowCardinalityGeoColumnOnString)).to.equal('testViz1');
              });
            });
            describe('when some columns have no defaultIf but the rest do', function() {
              it('should return the first visualization with a defaultIf = true', function() {
                overrideMap({ testPT: [
                  { type: 'testViz1' },
                  { type: 'testViz2', defaultIf: 'isHighCardinality' },
                  { type: 'testViz3', defaultIf: 'isLowCardinality' },
                  { type: 'testViz4', defaultIf: 'isLowCardinality' }
                ]});
                expect(CardTypeMapping.defaultVisualizationForColumn(createLowCardinalityColumn('testPT'))).to.equal('testViz3');
              });
            });
            describe('when some columns have no defaultIf but the rest do, all evaluating to false', function() {
              it('should return the first visualization with no defaultIf expression', function() {
                overrideMap({ testPT: [
                  { type: 'testViz1', defaultIf: 'isHighCardinality' },
                  { type: 'testViz2', defaultIf: 'isGeoregionComputed' },
                  { type: 'testViz3' }
                ]});
                expect(CardTypeMapping.defaultVisualizationForColumn(createLowCardinalityColumn('testPT'))).to.equal('testViz3');
              });
            });
          });
        });

      });
      describe('for an undefined physical datatype', function() {
        it('should return undefined', function() {
          overrideMap({ testPT: [ 'testViz' ] });
          expect(CardTypeMapping.defaultVisualizationForColumn(createLowCardinalityColumn('invalidDatatype'))).to.equal(undefined);
        });
      });

    });

    describe('visualizationSupportedForColumn', function() {
      it('should return false for an unsupported physical datatype', function() {
          overrideMap({ testPT: [ 'column' ] });
          expect(CardTypeMapping.visualizationSupportedForColumn(createLowCardinalityColumn('lol_wrong'))).to.equal(false);
      });
      it('should return false for an unsupported visualization', function() {
          overrideMap({ testPT: [ 'pie_charts_yeah_right' ] });
          expect(CardTypeMapping.visualizationSupportedForColumn(createLowCardinalityColumn('testPT'))).to.equal(false);
      });
      it('should return true for a supported visualization', function() {
          overrideMap({ testPT: [ 'column' ] });
          expect(CardTypeMapping.visualizationSupportedForColumn(createLowCardinalityColumn('testPT'))).to.equal(true);
      });
    });

    function modelifyCardType(cardType) {
      var model = new Model();
      model.defineObservableProperty('cardType', cardType);
      return model;
    }

    describe('modelIsExportable', function() {
      it('should return false for an unexportable visualization', function() {
          expect(CardTypeMapping.modelIsExportable(modelifyCardType('search'))).to.equal(false);
      });
      it('should return true for a supported visualization', function() {
          expect(CardTypeMapping.modelIsExportable(modelifyCardType('column'))).to.equal(true);
      });
    });

    describe('modelIsCustomizable', function() {
      it('should return false for an uncustomizable visualization', function() {
          expect(CardTypeMapping.modelIsCustomizable(modelifyCardType('column'))).to.equal(false);
      });
      it('should return true for a customizable visualization', function() {
          expect(CardTypeMapping.modelIsCustomizable(modelifyCardType('choropleth'))).to.equal(true);
      });
    });

  });

})();
