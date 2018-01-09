import _ from 'lodash';
import thunk from 'redux-thunk';

import reducer from 'common/authoring_workflow/reducers';
import getVifTemplates from 'common/authoring_workflow/vifs';
import * as actions from 'common/authoring_workflow/actions';
import mockFilters from './mockFilters';
import { COLOR_PALETTE_VALUES, DEFAULT_PRIMARY_COLOR } from 'common/authoring_workflow/constants';

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

describe('AuthoringWorkflow reducer', () => {
  describe('vif', () => {
    it('returns the default state if the input state is undefined', () => {
      assert.deepEqual(getDefaultState().vifAuthoring.vifs, getTestState().vifAuthoring.vifs);
      assert.deepPropertyVal(getDefaultState(), 'vifAuthoring.authoring.selectedVisualizationType', null);
    });

    it('ignores weird actions', () => {
      var badAction = {
        type: 'JAYWALKING'
      };

      expect(reducer(getTestState(), badAction).vifAuthoring).to.deep.equal(getTestState().vifAuthoring);
    });

    describe('vif setters', () => {
      function resetsCenterAndZoomWhenChangingDimensions() {
        it('resets center and zoom when reconfiguring dimension', () => {
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
        it(`sets ${vifPath} to ${value} using ${actionName} for ${vifTypes}`, () => {
          var action;

          if (_.isArray(value)) {
            action = actions[actionName].apply(null, value);
          } else {
            action = actions[actionName](value);
          }

          var newState = reducer(getTestState(), action);

          forAllVifs(newState, (vif, type) => {
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

      function shouldSetVifWithObject(actionName, params, value, vifPath, vifTypes) {
        it(`sets ${vifPath} to ${value} using ${actionName} for ${vifTypes}`, () => {
          const action = actions[actionName](params);
          const newState = reducer(getTestState(), action);

          forAllVifs(newState, (vif, type) => {
            if (_.includes(vifTypes, type)) {
              const newValue = _.get(vif, vifPath);
              assert.equal(newValue, value);
            }
          });
        });
      }

      shouldSetVif('setTitle', 'Title', 'title', ['columnChart', 'regionMap', 'featureMap', 'map', 'timelineChart', 'histogram', 'pieChart']);
      shouldSetVif('setDescription', 'Description', 'description', ['regionMap', 'columnChart', 'featureMap', 'map', 'timelineChart', 'histogram', 'pieChart']);
      shouldSetVif('setViewSourceDataLink', true, 'configuration.viewSourceDataLink', ['regionMap', 'columnChart', 'featureMap', 'map', 'timelineChart', 'histogram', 'pieChart']);

      shouldSetVif('setDimension', 'dimension', 'series[0].dataSource.dimension.columnName', ['regionMap', 'columnChart', 'featureMap', 'map', 'timelineChart', 'histogram', 'pieChart']);

      shouldSetVifWithObject(
        'setMeasureColumn',
        { columnName: 'anything', isFlyoutSeries: false, relativeIndex: 0 },
        'anything',
        'series[0].dataSource.measure.columnName',
        ['barChart', 'columnChart', 'histogram', 'pieChart', 'regionMap', 'timelineChart']);

      shouldSetVifWithObject(
        'setMeasureAggregation',
        { aggregationFunction: 'count', isFlyoutSeries: false, relativeIndex: 0 },
        'count',
        'series[0].dataSource.measure.aggregationFunction',
        ['barChart', 'columnChart', 'histogram', 'pieChart', 'regionMap', 'timelineChart']);

      shouldSetVif('setPrimaryColor', [0, '#00F'], 'series[0].color.primary', ['columnChart', 'timelineChart', 'histogram', 'featureMap', 'map']);
      shouldSetVif('setSecondaryColor', [0, '#00F'], 'series[0].color.secondary', ['columnChart', 'histogram']);

      shouldSetVif('setPointSize', 1.3, 'configuration.pointSize', ['featureMap', 'map']);

      shouldSetVif('setColorScale', ['one', 'two', 'three'], 'configuration.legend.negativeColor', ['regionMap']);
      shouldSetVif('setColorScale', ['one', 'two', 'three'], 'configuration.legend.zeroColor', ['regionMap']);
      shouldSetVif('setColorScale', ['one', 'two', 'three'], 'configuration.legend.positiveColor', ['regionMap']);

      shouldSetVif('setColorPalette', 'alternate2', 'series[0].color.palette', ['pieChart']);

      shouldSetVif('setShapefileUid', 'four-four', 'configuration.shapefile.uid', ['regionMap']);
      shouldSetVif('setShapefilePrimaryKey', 'imaprimarykey', 'configuration.shapefile.primaryKey', ['regionMap']);
      shouldSetVif('setShapefileGeometryLabel', 'elaborawhat?', 'configuration.shapefile.geometryLabel', ['regionMap']);

      shouldSetVif('setBaseLayer', 'https://yes.com', 'configuration.baseLayerUrl', ['regionMap', 'featureMap', 'map']);

      shouldSetVif('setDimensionLabelAreaSize', 'dimensionLabelAreaSize', 'configuration.dimensionLabelAreaSize', ['barChart']);
      shouldSetVif('setLabelTop', 'labelTop', 'configuration.axisLabels.top', ['barChart']);
      shouldSetVif('setLabelBottom', 'labelBottom', 'configuration.axisLabels.bottom', ['columnChart', 'timelineChart', 'histogram', 'comboChart']);
      shouldSetVif('setLabelLeft', 'labelLeft', 'configuration.axisLabels.left', ['barChart', 'columnChart', 'timelineChart', 'histogram', 'comboChart']);
      shouldSetVif('setLabelRight', 'labelRight', 'configuration.axisLabels.right', ['comboChart']);

      shouldSetVif('setShowValueLabels', true, 'configuration.showValueLabels', ['barChart', 'pieChart']);
      shouldSetVif('setShowValueLabelsAsPercent', true, 'configuration.showValueLabelsAsPercent', ['pieChart']);

      shouldSetVif('setUnitsOne', [0, 'Thought'], 'series[0].unit.one', ['regionMap', 'columnChart', 'featureMap', 'map', 'timelineChart', 'histogram', 'pieChart', 'comboChart']);
      shouldSetVif('setUnitsOther', [0, 'Thought'], 'series[0].unit.other', ['regionMap', 'columnChart', 'featureMap', 'map', 'timelineChart', 'histogram', 'pieChart', 'comboChart']);

      shouldSetVif('setRowInspectorTitleColumnName', 'columnName', 'configuration.rowInspectorTitleColumnName', ['featureMap', 'map']);

      shouldSetVif('setCenterAndZoom', { zoom: 12, center: { longitude: 90, latitude: 48 } }, 'configuration.mapCenterAndZoom', ['featureMap', 'map', 'regionMap']);

      shouldSetVif('setPrecision', 'DAY', 'series[0].dataSource.precision', ['timelineChart']);
      shouldSetVif('setTreatNullValuesAsZero', true, 'configuration.treatNullValuesAsZero', ['timelineChart']);

      shouldSetVif('setLimitNoneAndShowOtherCategory', undefined, 'configuration.showOtherCategory', ['barChart']);

      shouldSetVif('setShowOtherCategory', true, 'configuration.showOtherCategory', ['barChart', 'pieChart']);

      shouldSetVif('setMapType', 'pointMap', 'series[0].mapOptions.mapType', ['map']);
      shouldSetVif('setPointMapPointSize', 1, 'series[0].mapOptions.pointMapPointSize', ['map']);
      shouldSetVif('setPointSizeByColumn', 'columnName', 'series[0].mapOptions.resizePointsBy', ['map']);
      shouldSetVif('setMinimumPointSize', 3, 'series[0].mapOptions.minimumPointSize', ['map']);
      shouldSetVif('setMaximumPointSize', 7, 'series[0].mapOptions.maximumPointSize', ['map']);
      shouldSetVif('setNumberOfDataClasses', 5, 'series[0].mapOptions.numberOfDataClasses', ['map']);
      shouldSetVif('setMaxClusteringZoomLevel', 8, 'series[0].mapOptions.maxClusteringZoomLevel', ['map']);
      shouldSetVif('setPointThreshold', 4500, 'series[0].mapOptions.pointThreshold', ['map']);
      shouldSetVif('setClusterRadius', 50, 'series[0].mapOptions.clusterRadius', ['map']);
      shouldSetVif('setMaxClusterSize', 20, 'series[0].mapOptions.maxClusterSize', ['map']);
      shouldSetVif('setStackRadius', 20, 'series[0].mapOptions.stackRadius', ['map']);
      shouldSetVif('setPointColorByColumn', 'columnName', 'series[0].mapOptions.colorPointsBy', ['map']);
      shouldSetVif('setLineWeight', 5, 'series[0].mapOptions.lineWeight', ['map']);
      shouldSetVif('setLineWeightByColumn', 'columnName', 'series[0].mapOptions.weighLinesBy', ['map']);
      shouldSetVif('setMinimumLineWeight', 3, 'series[0].mapOptions.minimumLineWeight', ['map']);
      shouldSetVif('setMaximumLineWeight', 7, 'series[0].mapOptions.maximumLineWeight', ['map']);
      shouldSetVif('setLineColorByColumn', 'columnName', 'series[0].mapOptions.colorLinesBy', ['map']);
      shouldSetVif('setPointAggregation', 'heat_map', 'series[0].mapOptions.pointAggregation', ['map']);
      shouldSetVif('setBoundaryColorByColumn', 'columnName', 'series[0].mapOptions.colorBoundariesBy', ['map']);
      shouldSetVif('setQuantificationMethod', 'numerical', 'series[0].mapOptions.quantificationMethod', ['map']);

      describe('when settings the x-axis scaling mode', () => {

        it('sets scaling mode to fit', () => {
          const action = actions.setXAxisScalingMode({ shouldFit: true });
          const newState = reducer(getTestState(), action);
          assert.equal(_.get(newState.vifAuthoring.vifs.timelineChart, 'configuration.xAxisScalingMode'), 'fit');
        });

        it('sets scaling mode to pan', () => {
          const action = actions.setXAxisScalingMode({ shouldFit: false });
          const newState = reducer(getTestState(), action);
          assert.equal(_.get(newState.vifAuthoring.vifs.timelineChart, 'configuration.xAxisScalingMode'), 'pan');
        });
      });

      describe('when configuring a Feature map', () => {
        resetsCenterAndZoomWhenChangingDimensions();

        it('sets configuration.pointOpacity', () => {
          var action = actions.setPointOpacity('1');
          var newState = reducer(getTestState(), action);

          expect(_.get(newState.vifAuthoring.vifs.featureMap, 'configuration.pointOpacity')).to.equal(1);
        });

        it('sets configuration.baseLayerOpacity', () => {
          var action = actions.setBaseLayerOpacity('0.5');
          var newState = reducer(getTestState(), action);

          expect(_.get(newState.vifAuthoring.vifs.featureMap, 'configuration.baseLayerOpacity')).to.equal(0.5);
        });
      });

      describe('when configuring a New map', function() {
        resetsCenterAndZoomWhenChangingDimensions();

        it('sets configuration.pointOpacity', function() {
          var action = actions.setPointOpacity('1');
          var newState = reducer(getTestState(), action);

          expect(_.get(newState.vifAuthoring.vifs.map, 'configuration.pointOpacity')).to.equal(1);
        });

        it('sets configuration.baseLayerOpacity', function() {
          var action = actions.setBaseLayerOpacity('0.5');
          var newState = reducer(getTestState(), action);

          expect(_.get(newState.vifAuthoring.vifs.map, 'configuration.baseLayerOpacity')).to.equal(0.5);
        });
      });

      describe('when a new series is appended', () => {
        let state;

        beforeEach(() => {
          state = getDefaultState();
        });

        it('the color palette should initially be undefined', () => {
          assert.isUndefined(state.vifAuthoring.vifs.columnChart.series[0].color.palette);
        });

        it('the primary color should initially be the DEFAULT_PRIMARY_COLOR', () => {
          assert.equal(
            state.vifAuthoring.vifs.columnChart.series[0].color.primary,
            DEFAULT_PRIMARY_COLOR
          );
        });

        it('should set the color palette to "categorical"', () => {
          const newState = reducer(state, actions.appendSeries({ isInitialLoad: false }));
          assert.equal(
            newState.vifAuthoring.vifs.columnChart.series[0].color.palette,
            'categorical'
          );
        });

        it('should set the primary color the first color in the "categorical" color palette', () => {
          const newState = reducer(state, actions.appendSeries({ isInitialLoad: false, seriesIndex: 1 }));
          assert.equal(
            newState.vifAuthoring.vifs.columnChart.series[0].color.primary,
            COLOR_PALETTE_VALUES.categorical[0]
          );
        });
      });

      describe('when a new flyout series is appended', () => {
        let state;

        beforeEach(() => {
          state = getDefaultState();
        });

        it('should set the color palette to "categorical"', () => {
          const newState = reducer(state, actions.appendSeries({ isFlyoutSeries: true, isInitialLoad: false }));
          assert.equal(newState.vifAuthoring.vifs.columnChart.series.length, 2);
          assert.equal(newState.vifAuthoring.vifs.columnChart.series[1].type, 'flyout');
        });
      });

      describe('when a flyout series is removed', () => {
        let state;

        beforeEach(() => {
          state = reducer(
            getDefaultState(),
            actions.appendSeries({ isFlyoutSeries: true, isInitialLoad: false })
          );
        });

        it('should remove the flyout series', () => {

          assert.equal(state.vifAuthoring.vifs.columnChart.series.length, 2);
          assert.equal(state.vifAuthoring.vifs.columnChart.series[1].type, 'flyout');

          const newState = reducer(state, actions.removeSeries({ isFlyoutSeries: true, relativeIndex: 0 }));
          assert.equal(newState.vifAuthoring.vifs.columnChart.series.length, 1);
          assert.equal(newState.vifAuthoring.vifs.columnChart.series[0].type, 'columnChart');
        });
      });

      describe('when called setFlyoutMeasureColumn', () => {
        let state;

        beforeEach(() => {
          state = reducer(
            getDefaultState(),
            actions.appendSeries({ isFlyoutSeries: true, isInitialLoad: false })
          );
        });

        it('should set the flyout column name', () => {
          // Flyouts are at the end of the series list, so the first flyout series is at
          // seriesIndex 1 (and flyout relative series index 0).
          const newState = reducer(state, actions.setMeasureColumn({
            isFlyoutSeries: true,
            relativeIndex: 0,
            columnName: 'NEW_COLUMN_NAME'
          }));

          const columnName = _.get(newState, 'vifAuthoring.vifs.columnChart.series[1].dataSource.measure.columnName');
          assert.equal(columnName, 'NEW_COLUMN_NAME');
        });
      });

      describe('when called setFlyoutMeasureAggregation', () => {
        let state;

        beforeEach(() => {
          state = reducer(
            getDefaultState(),
            actions.appendSeries({ isFlyoutSeries: true, isInitialLoad: false })
          );
        });

        it('should set the flyout column name', () => {
          // Flyouts are at the end of the series list, so the first flyout series is at
          // seriesIndex 1 (and flyout relative series index 0).
          const newState = reducer(state, actions.setMeasureAggregation({
            aggregationFunction: 'SUM',
            isFlyoutSeries: true,
            relativeIndex: 0
          }));

          const aggregationFunction = _.get(newState, 'vifAuthoring.vifs.columnChart.series[1].dataSource.measure.aggregationFunction');
          assert.equal(aggregationFunction, 'SUM');
        });
      });

      describe('when a series is removed', () => {
        let state;

        beforeEach(() => {
          state = reducer(
            getDefaultState(),
            actions.appendSeries({ isInitialLoad: false })
          );
        });

        it('should reset the color palette to undefined', () => {
          const newState = reducer(state, actions.removeSeries({ isFlyoutSeries: false, relativeIndex: 0 }));
          assert.isUndefined(newState.vifAuthoring.vifs.columnChart.series[0].color.palette);
        });

        it('should reset the primary color to the DEFAULT_PRIMARY_COLOR', () => {
          const newState = reducer(state, actions.removeSeries({ isFlyoutSeries: false, relativeIndex: 0 }));
          assert.equal(
            newState.vifAuthoring.vifs.columnChart.series[0].color.primary,
            DEFAULT_PRIMARY_COLOR
          );
        });
      });

      describe('when a new dimension is selected', () => {
        var state;

        beforeEach(() => {
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

      describe('when configuring a Region map', () => {
        resetsCenterAndZoomWhenChangingDimensions();

        it('sets configuration.computedColumnName', () => {
          var computedColumnName = 'hello';
          var action = actions.setComputedColumn(computedColumnName);
          var newState = reducer(getTestState(), action);
          var regionMap = newState.vifAuthoring.vifs.regionMap;

          expect(_.get(regionMap, 'configuration.computedColumnName')).to.equal(computedColumnName);
        });

        it('sets configuration.shapefile', () => {
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

        it('sets configuration.baseLayerOpacity', () => {
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
            assert.deepEqual(newState.vifAuthoring.vifs[type], getVifTemplates()[type]);
          }
        });
      });
    });
  });

  describe('metadata', () => {
    it('returns the default state if the input state is undefined', () => {
      var metadata = getDefaultState().metadata;
      expect(metadata.isLoading).to.equal(false);
      expect(metadata.data).to.equal(null);
      expect(metadata.error).to.equal(null);
      expect(metadata.isCuratedRegionsLoading).to.equal(false);
      expect(metadata.hasCuratedRegionsError).to.equal(false);
      expect(metadata.curatedRegions).to.equal(null);
    });

    describe('REQUEST_METADATA', () => {
      let state;
      let action;
      let newState;
      var domain = 'https://example.com';
      var datasetUid = 'asdf-qwer';

      beforeEach(() => {
        state = getDefaultState();
        action = actions.requestMetadata(domain, datasetUid);
        newState = reducer(state, action);
      });

      it('sets isLoading to true', () => {
        expect(newState.metadata.isLoading).to.equal(true);
      });

      it('clears the data key', () => {
        expect(newState.metadata.data).to.equal(null);
      });

      it('sets the domain', () => {
        expect(newState.metadata.domain).to.equal(domain);
      });

      it('sets the datasetUid', () => {
        expect(newState.metadata.datasetUid).to.equal(datasetUid);
      });
    });

    describe('RECEIVE_METADATA', () => {
      const datasetMetadata = { id: 'data-sets', columns: [] };
      const baseViewMetadata = { id: 'base-view', columns: [] };
      let state;
      let action;
      let newState;

      beforeEach(() => {
        state = _.merge(getDefaultState(), {
          metadata: {
            isLoading: true
          }
        });

        action = actions.receiveMetadata(
          datasetMetadata,
          baseViewMetadata
        );

        newState = reducer(state, action);
      });

      it('sets isLoading to false', () => {
        assert.isFalse(newState.metadata.isLoading);
      });

      it('sets the data key', () => {
        assert.deepEqual(newState.metadata.data, datasetMetadata);
      });
    });

    describe('HANDLE_METADATA_ERROR', () => {
      let state;
      let action;
      let newState;

      beforeEach(() => {
        state = _.merge(getDefaultState(), {
          metadata: {
            isLoading: true
          }
        });

        action = actions.handleMetadataError('error!');
        newState = reducer(state, action);
      });

      it('sets isLoading to false', () => {
        expect(newState.metadata.isLoading).to.equal(false);
      });

      it('sets the error key', () => {
        expect(newState.metadata.error).to.equal('error!');
      });

      it('clears domain', () => {
        expect(newState.metadata.domain).to.be.null;
      });

      it('clears datasetUid', () => {
        expect(newState.metadata.datasetUid).to.be.null;
      });
    });

    describe('REQUEST_CURATED_REGIONS', () => {
      let state;
      let action;
      let newState;
      var domain = 'https://example.com';
      var datasetUid = 'asdf-qwer';

      beforeEach(() => {
        state = getDefaultState();
        action = actions.requestCuratedRegions();
        newState = reducer(state, action);
      });

      it('sets isCuratedRegionsLoading to true', () => {
        expect(newState.metadata.isCuratedRegionsLoading).to.equal(true);
      });

      it('clears the hasCuratedRegionsError key', () => {
        expect(newState.metadata.hasCuratedRegionsError).to.equal(false);
      });

      it('clears the curatedRegions key', () => {
        expect(newState.metadata.curatedRegions).to.equal(null);
      });
    });

    describe('RECEIVE_CURATED_REGIONS', () => {
      let state;
      let action;
      let newState;

      beforeEach(() => {
        state = _.merge(getDefaultState(), {
          metadata: {
            isCuratedRegionsLoading: true
          }
        });

        action = actions.receiveCuratedRegions({ id: 'regi-ons0' });

        newState = reducer(state, action);
      });

      it('sets isCuratedRegionsLoading to false', () => {
        expect(newState.metadata.isCuratedRegionsLoading).to.equal(false);
      });

      it('clears the hasCuratedRegionsError key', () => {
        expect(newState.metadata.hasCuratedRegionsError).to.equal(false);
      });

      it('sets the curatedRegions key', () => {
        expect(newState.metadata.curatedRegions).to.deep.equal({ id: 'regi-ons0' });
      });
    });

    describe('HANDLE_CURATED_REGIONS_ERROR', () => {
      let state;
      let action;
      let newState;

      beforeEach(() => {
        state = _.merge(getDefaultState(), {
          metadata: {
            isCuratedRegionsLoading: true
          }
        });

        action = actions.handleCuratedRegionsError();
        newState = reducer(state, action);
      });

      it('sets isCuratedRegionsLoading to false', () => {
        expect(newState.metadata.isCuratedRegionsLoading).to.equal(false);
      });

      it('sets the hasCuratedRegionsError key', () => {
        expect(newState.metadata.hasCuratedRegionsError).to.equal(true);
      });

      it('clears the curatedRegions key', () => {
        expect(newState.metadata.curatedRegions).to.be.null;
      });
    });

    describe('SET_FILTERS', () => {
      let state;
      let action;
      let newState;

      beforeEach(() => {
        state = getTestState();
        action = actions.setFilters(mockFilters);
        newState = reducer(state, action);
      });

      it('sets the authoring filters', () => {
        expect(newState.vifAuthoring.authoring.filters).to.deep.equal(mockFilters);
      });

      it('sets the filters for each vif', () => {
        const filters = newState.vifAuthoring.vifs.columnChart.series[0].dataSource.filters;
        expect(filters).to.deep.equal(mockFilters);
      });
    });
  });
});
