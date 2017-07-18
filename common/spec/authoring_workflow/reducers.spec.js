import _ from 'lodash';
import thunk from 'redux-thunk';

import reducer from 'common/authoring_workflow/reducers';
import getVifTemplates from 'common/authoring_workflow/vifs';
import * as actions from 'common/authoring_workflow/actions';
import vifs from 'common/authoring_workflow/vifs';
import mockFilters from './mockFilters';

// Note: by convention, reducers return their default state when passed undefined.
function getDefaultState() {
  return reducer();
}

function getTestState() {
  var state = {};

  const vifs = _.merge(getVifTemplates(), { initialVif: {} });
  _.set(state, 'vifAuthoring.vifs', vifs);
  _.set(state, 'vifAuthoring.authoring.selectedVisualizationType', 'columnChart');

  return state;
}

function forAllVifs(state, verifier) {
  assert.isAtLeast(_.keys(state.vifAuthoring.vifs).length, 1);
  _.each(state.vifAuthoring.vifs, verifier);
}

describe('AuthoringWorkflow reducer', function() {
  describe('vif', function() {
    it('returns the default state if the input state is undefined', function() {
      assert.deepEqual(getDefaultState().vifAuthoring.vifs, getTestState().vifAuthoring.vifs);
      assert.deepPropertyVal(getDefaultState(), 'vifAuthoring.authoring.selectedVisualizationType', null);
    });

    it('ignores weird actions', function() {
      var badAction = {
        type: 'JAYWALKING'
      };

      expect(reducer(getTestState(), badAction).vifAuthoring).to.deep.equal(getTestState().vifAuthoring);
    });

    describe('vif setters', function() {
      function resetsCenterAndZoomWhenChangingDimensions() {
        it('resets center and zoom when reconfiguring dimension', function() {
          var objectPath = 'vifAuthoring.vifs.featureMap.configuration';
          var action = actions.setDimension('dimension');
          var state = getTestState();

          _.set(state, `${objectPath}.mapCenterAndZoom`, {});

          var newState = reducer(getTestState(), action);
          var configuration = _.get(newState, objectPath);

          expect(configuration).to.not.have.property('mapCenterAndZoom');
        });
      }

      function shouldSetVif(actionName, value, vifPath, vifTypes) {
        it(`sets ${vifPath} to ${value} using ${actionName} for ${vifTypes}`, function() {
          var action;

          if (_.isArray(value)) {
            action = actions[actionName].apply(null, value);
          } else {
            action = actions[actionName](value);
          }

          var newState = reducer(getTestState(), action);

          forAllVifs(newState, function(vif, type) {
            if (_.includes(vifTypes, type)) {
              var newValue = _.get(vif, vifPath);

              if (_.isArray(value)) {
                expect(value).to.include(newValue);
              } else {
                expect(newValue).to.eql(value);
              }
            }
          });
        });
      }

      shouldSetVif('setTitle', 'Title', 'title', ['columnChart', 'regionMap', 'featureMap', 'timelineChart', 'histogram', 'pieChart']);
      shouldSetVif('setDescription', 'Description', 'description', ['regionMap', 'columnChart', 'featureMap', 'timelineChart', 'histogram', 'pieChart']);
      shouldSetVif('setViewSourceDataLink', true, 'configuration.viewSourceDataLink', ['regionMap', 'columnChart', 'featureMap', 'timelineChart', 'histogram', 'pieChart']);

      shouldSetVif('setDimension', 'dimension', 'series[0].dataSource.dimension.columnName', ['regionMap', 'columnChart', 'featureMap', 'timelineChart', 'histogram', 'pieChart']);

      shouldSetVif('setMeasure', [0, 'anything'], 'series[0].dataSource.measure.columnName', ['regionMap', 'columnChart', 'timelineChart', 'histogram', 'pieChart']);
      shouldSetVif('setMeasureAggregation', [0, 'count'], 'series[0].dataSource.measure.aggregationFunction', null);

      shouldSetVif('setPrimaryColor', [0, '#00F'], 'series[0].color.primary', ['columnChart', 'timelineChart', 'histogram', 'featureMap']);
      shouldSetVif('setSecondaryColor', [0, '#00F'], 'series[0].color.secondary', ['columnChart', 'histogram']);

      shouldSetVif('setPointSize', 1.3, 'configuration.pointSize', ['featureMap']);

      shouldSetVif('setColorScale', ['one', 'two', 'three'], 'configuration.legend.negativeColor', ['regionMap']);
      shouldSetVif('setColorScale', ['one', 'two', 'three'], 'configuration.legend.zeroColor', ['regionMap']);
      shouldSetVif('setColorScale', ['one', 'two', 'three'], 'configuration.legend.positiveColor', ['regionMap']);

      shouldSetVif('setColorPalette', 'alternate2', 'series[0].color.palette', ['pieChart']);

      shouldSetVif('setShapefileUid', 'four-four', 'configuration.shapefile.uid', ['regionMap']);
      shouldSetVif('setShapefilePrimaryKey', 'imaprimarykey', 'configuration.shapefile.primaryKey', ['regionMap']);
      shouldSetVif('setShapefileGeometryLabel', 'elaborawhat?', 'configuration.shapefile.geometryLabel', ['regionMap']);

      shouldSetVif('setBaseLayer', 'https://yes.com', 'configuration.baseLayerUrl', ['regionMap', 'featureMap']);

      shouldSetVif('setDimensionLabelAreaSize', 'dimensionLabelAreaSize', 'configuration.dimensionLabelAreaSize', ['barChart']);
      shouldSetVif('setLabelTop', 'labelTop', 'configuration.axisLabels.top', ['barChart']);
      shouldSetVif('setLabelBottom', 'labelBottom', 'configuration.axisLabels.bottom', ['columnChart', 'timelineChart', 'histogram']);
      shouldSetVif('setLabelLeft', 'labelLeft', 'configuration.axisLabels.left', ['barChart', 'columnChart', 'timelineChart', 'histogram']);
      shouldSetVif('setLabelRight', 'labelRight', 'configuration.axisLabels.right', []);

      shouldSetVif('setShowValueLabels', true, 'configuration.showValueLabels', ['barChart', 'pieChart']);
      shouldSetVif('setShowValueLabelsAsPercent', true, 'configuration.showValueLabelsAsPercent', ['pieChart']);
      shouldSetVif('setShowLegend', true, 'configuration.showLegend', ['barChart', 'columnChart']);

      shouldSetVif('setUnitsOne', [0, 'Thought'], 'series[0].unit.one', ['regionMap', 'columnChart', 'featureMap', 'timelineChart', 'histogram', 'pieChart']);
      shouldSetVif('setUnitsOther', [0, 'Thought'], 'series[0].unit.other', ['regionMap', 'columnChart', 'featureMap', 'timelineChart', 'histogram', 'pieChart']);

      shouldSetVif('setRowInspectorTitleColumnName', 'columnName', 'configuration.rowInspectorTitleColumnName', ['featureMap']);

      shouldSetVif('setCenterAndZoom', {zoom: 12, center: {longitude: 90, latitude: 48}}, 'configuration.mapCenterAndZoom', ['featureMap', 'regionMap']);

      shouldSetVif('setPrecision', 'DAY', 'series[0].dataSource.precision', ['timelineChart']);
      shouldSetVif('setTreatNullValuesAsZero', true, 'configuration.treatNullValuesAsZero', ['timelineChart']);

      shouldSetVif('setLimitNoneAndShowOtherCategory', undefined, 'configuration.showOtherCategory', ['barChart']);

      shouldSetVif('setShowOtherCategory', true, 'configuration.showOtherCategory', ['barChart', 'pieChart']);

      describe('when configuring a Feature map', function() {
        resetsCenterAndZoomWhenChangingDimensions();

        it('sets configuration.pointOpacity', function() {
          var action = actions.setPointOpacity('1');
          var newState = reducer(getTestState(), action);

          expect(_.get(newState.vifAuthoring.vifs.featureMap, 'configuration.pointOpacity')).to.equal(1);
        });

        it('sets configuration.baseLayerOpacity', function() {
          var action = actions.setBaseLayerOpacity('0.5');
          var newState = reducer(getTestState(), action);

          expect(_.get(newState.vifAuthoring.vifs.featureMap, 'configuration.baseLayerOpacity')).to.equal(0.5);
        });
      });

      describe('when a new dimension is selected', function() {
        var state;

        beforeEach(function() {
          state = reducer(
            getTestState(),
            actions.setDimensionGroupingColumnName('groupingColumn')
          );
        });

        it('should keep the grouping column if it is different from the dimension column', () => {
          const newState = reducer(state, actions.setDimension('anotherColumn'));
          assert.equal(
            newState.vifAuthoring.vifs.columnChart.series[0].dataSource.dimension.grouping.columnName,
            'groupingColumn'
          );
        });

        it('should remove the grouping column if it is the same as the dimension column', () => {
          const newState = reducer(state, actions.setDimension('groupingColumn'));
          assert.isUndefined(
            newState.vifAuthoring.vifs.columnChart.series[0].dataSource.dimension.grouping
          );
        });
      });

      describe('when configuring a Region map', function() {
        resetsCenterAndZoomWhenChangingDimensions();

        it('sets configuration.computedColumnName', function() {
          var computedColumnName = 'hello';
          var action = actions.setComputedColumn(computedColumnName);
          var newState = reducer(getTestState(), action);
          var regionMap = newState.vifAuthoring.vifs.regionMap;

          expect(_.get(regionMap, 'configuration.computedColumnName')).to.equal(computedColumnName);
        });

        it('sets configuration.shapefile', function() {
          var shapefileUid = 'walr-uses';
          var primaryKey = 'primaryKey';
          var geometryLabel = 'geometryLabel';

          var action = actions.setShapefile(shapefileUid, primaryKey, geometryLabel);
          var newState = reducer(getTestState(), action);
          var regionMap = newState.vifAuthoring.vifs.regionMap;

          expect(_.get(regionMap, 'configuration.shapefile.uid')).to.equal(shapefileUid);
          expect(_.get(regionMap, 'configuration.shapefile.primaryKey')).to.equal(primaryKey);
          expect(_.get(regionMap, 'configuration.shapefile.geometryLabel')).to.equal(geometryLabel);
        });

        it('sets configuration.baseLayerOpacity', function() {
          var action = actions.setBaseLayerOpacity('0.5');
          var newState = reducer(getTestState(), action);
          var regionMap = newState.vifAuthoring.vifs.regionMap;

          expect(_.get(regionMap, 'configuration.baseLayerOpacity')).to.equal(0.5);
        });
      });

      it('should reset vif to default state', () => {
        const newState = reducer(getTestState(), actions.RESET_STATE);

        _.each(newState.vifAuthoring.vifs, (vif, type) => {
          if (type !== 'initialVif') {
            assert.deepEqual(newState.vifAuthoring.vifs[type], vifs()[type]);
          }
        });
      });
    });
  });

  describe('metadata', function() {
    it('returns the default state if the input state is undefined', function() {
      var metadata = getDefaultState().metadata;
      expect(metadata.isLoading).to.equal(false);
      expect(metadata.data).to.equal(null);
      expect(metadata.error).to.equal(null);
      expect(metadata.isCuratedRegionsLoading).to.equal(false);
      expect(metadata.hasCuratedRegionsError).to.equal(false);
      expect(metadata.curatedRegions).to.equal(null);
    });

    describe('REQUEST_METADATA', function() {
      var state, action, newState;
      var domain = 'https://example.com';
      var datasetUid = 'asdf-qwer';

      beforeEach(function() {
        state = getDefaultState();
        action = actions.requestMetadata(domain, datasetUid);
        newState = reducer(state, action);
      });

      it('sets isLoading to true', function() {
        expect(newState.metadata.isLoading).to.equal(true);
      });

      it('clears the data key', function() {
        expect(newState.metadata.data).to.equal(null);
      });

      it('clears the phidippidesMetadata key', function() {
        expect(newState.metadata.phidippidesMetadata).to.equal(null);
      });

      it('sets the domain', function() {
        expect(newState.metadata.domain).to.equal(domain);
      });

      it('sets the datasetUid', function() {
        expect(newState.metadata.datasetUid).to.equal(datasetUid);
      });
    });

    describe('RECEIVE_METADATA', function() {
      var state, action, newState;

      beforeEach(function() {
        state = _.merge(getDefaultState(), {
          metadata: {
            isLoading: true
          }
        });

        action = actions.receiveMetadata([
          { id: 'data-sets', columns: [] },
          { id: 'phid-miss', columns: {} }
        ]);

        newState = reducer(state, action);
      });

      it('sets isLoading to false', function() {
        expect(newState.metadata.isLoading).to.equal(false);
      });

      it('sets the data key', function() {
        expect(newState.metadata.data).to.deep.equal({ id: 'data-sets', columns: [] });
        expect(newState.metadata.phidippidesMetadata).to.deep.equal({ id: 'phid-miss', columns: {} });
      });
    });

    describe('HANDLE_METADATA_ERROR', function() {
      var state, action, newState;

      beforeEach(function() {
        state = _.merge(getDefaultState(), {
          metadata: {
            isLoading: true
          }
        });

        action = actions.handleMetadataError('error!');
        newState = reducer(state, action);
      });

      it('sets isLoading to false', function() {
        expect(newState.metadata.isLoading).to.equal(false);
      });

      it('sets the error key', function() {
        expect(newState.metadata.error).to.equal('error!');
      });

      it('clears domain', function() {
        expect(newState.metadata.domain).to.be.null;
      });

      it('clears datasetUid', function() {
        expect(newState.metadata.datasetUid).to.be.null;
      });
    });

    describe('REQUEST_CURATED_REGIONS', function() {
      var state, action, newState;
      var domain = 'https://example.com';
      var datasetUid = 'asdf-qwer';

      beforeEach(function() {
        state = getDefaultState();
        action = actions.requestCuratedRegions();
        newState = reducer(state, action);
      });

      it('sets isCuratedRegionsLoading to true', function() {
        expect(newState.metadata.isCuratedRegionsLoading).to.equal(true);
      });

      it('clears the hasCuratedRegionsError key', function() {
        expect(newState.metadata.hasCuratedRegionsError).to.equal(false);
      });

      it('clears the curatedRegions key', function() {
        expect(newState.metadata.curatedRegions).to.equal(null);
      });
    });

    describe('RECEIVE_CURATED_REGIONS', function() {
      var state, action, newState;

      beforeEach(function() {
        state = _.merge(getDefaultState(), {
          metadata: {
            isCuratedRegionsLoading: true
          }
        });

        action = actions.receiveCuratedRegions({ id: 'regi-ons0' });

        newState = reducer(state, action);
      });

      it('sets isCuratedRegionsLoading to false', function() {
        expect(newState.metadata.isCuratedRegionsLoading).to.equal(false);
      });

      it('clears the hasCuratedRegionsError key', function() {
        expect(newState.metadata.hasCuratedRegionsError).to.equal(false);
      });

      it('sets the curatedRegions key', function() {
        expect(newState.metadata.curatedRegions).to.deep.equal({ id: 'regi-ons0' });
      });
    });

    describe('HANDLE_CURATED_REGIONS_ERROR', function() {
      var state, action, newState;

      beforeEach(function() {
        state = _.merge(getDefaultState(), {
          metadata: {
            isCuratedRegionsLoading: true
          }
        });

        action = actions.handleCuratedRegionsError();
        newState = reducer(state, action);
      });

      it('sets isCuratedRegionsLoading to false', function() {
        expect(newState.metadata.isCuratedRegionsLoading).to.equal(false);
      });

      it('sets the hasCuratedRegionsError key', function() {
        expect(newState.metadata.hasCuratedRegionsError).to.equal(true);
      });

      it('clears the curatedRegions key', function() {
        expect(newState.metadata.curatedRegions).to.be.null;
      });
    });

    describe('SET_PHIDIPPIDES_METADATA', function() {
      var state, action, newState;

      beforeEach(function() {
        state = _.merge(getDefaultState(), {
          metadata: {
            phidippidesMetadata: 'oldphi'
          }
        });

        action = actions.setPhidippidesMetadata('newphi');
        newState = reducer(state, action);
      });

      it('sets phidippides metadata', function() {
        expect(newState.metadata.phidippidesMetadata).to.equal('newphi');
      });
    });

    describe('SET_FILTERS', function() {
      var state, action, newState;

      beforeEach(function() {
        state = getTestState();
        action = actions.setFilters(mockFilters);
        newState = reducer(state, action);
      });

      it('sets the authoring filters', function() {
        expect(newState.vifAuthoring.authoring.filters).to.deep.equal(mockFilters);
      });

      it('sets the filters for each vif', function() {
        const filters = newState.vifAuthoring.vifs.columnChart.series[0].dataSource.filters;
        expect(filters).to.deep.equal(mockFilters);
      });
    });
  });
});
