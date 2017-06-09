import _ from 'lodash';
import vifs from 'common/authoring_workflow/vifs';
import * as selector from 'common/authoring_workflow/selectors/vifAuthoring';

function getDefaultState() {
  return {
    vifs: vifs(),
    authoring: {
      selectedVisualizationType: 'columnChart'
    }
  };
}

describe('vifAuthoring', function() {
  describe('getCurrentVif', function() {
    it('returns the selectedVisualizationType VIF', function() {
      expect(selector.getCurrentVif(getDefaultState())).to.be.deep.equal(vifs().columnChart);
    });
  });

  describe('getDatasetUid', function() {
    it('returns the current VIF\'s datasetUid', function() {
      expect(
        selector.getDatasetUid(getDefaultState())
      ).to.be.equal(_.get(vifs(), 'columnChart.series[0].dataSource.datasetUid'));
    });
  });

  describe('getDomain', function() {
    it('returns the current VIF\'s domain', function() {
      expect(
        selector.getDomain(getDefaultState())
      ).to.be.equal(_.get(vifs(), 'columnChart.series[0].dataSource.domain'));
    });
  });

  describe('getPrecision', function() {
    it('returns the current VIF\'s precision', function() {
      const state = getDefaultState();
      state.authoring.selectedVisualizationType = 'timelineChart';

      expect(
        selector.getPrecision(state)
      ).to.be.equal(_.get(vifs(), 'timelineChart.series[0].dataSource.precision'));
    });
  });

  describe('getTreatNullValuesAsZero', function() {
    it('returns the current VIF\'s treatNullValuesAsZero property', function() {
      const state = getDefaultState();
      state.authoring.selectedVisualizationType = 'timelineChart';

      expect(
        selector.getTreatNullValuesAsZero(state)
      ).to.be.equal(_.get(vifs(), 'timelineChart.configuration.treatNullValuesAsZero'));
    });
  });

  describe('isRegionMap', function() {
    describe('when it is a region map', function() {
      it('returns true', function() {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'regionMap';

        expect(
          selector.isRegionMap(state)
        ).to.be.true;
      });
    });

    describe('when it is not a region map', function() {
      it('returns false', function() {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'featureMap';

        expect(
          selector.isRegionMap(state)
        ).to.be.false;
      });
    });
  });

  describe('isValidRegionMapVif', function() {
    describe('when it is valid', function() {
      it('returns true', function() {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'regionMap';

        _.set(state, 'vifs.regionMap.configuration.computedColumnName', '@computed_column');
        _.set(state, 'vifs.regionMap.configuration.shapefile.uid', 'four-four');
        _.set(state, 'vifs.regionMap.series[0].dataSource.dimension.columnName', 'example_dimension');
        _.set(state, 'vifs.regionMap.series[0].dataSource.measure.aggregationFunction', 'sum');
        _.set(state, 'vifs.regionMap.series[0].dataSource.datasetUid', 'exam-ples');
        _.set(state, 'vifs.regionMap.series[0].dataSource.domain', 'example.com');

        expect(
          selector.isValidRegionMapVif(state)
        ).to.be.true;
      });
    });

    describe('when it is invalid', function() {
      it('returns false', function() {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'featureMap';

        expect(
          selector.isValidRegionMapVif(state)
        ).to.be.false;
      });
    });
  });

  describe('isValidColumnChartVif', function() {
    describe('when it is valid', function() {
      it('returns true', function() {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'columnChart';

        _.set(state, 'vifs.columnChart.series[0].dataSource.dimension.columnName', 'example_dimension');
        _.set(state, 'vifs.columnChart.series[0].dataSource.measure.columnName', 'example_measure');
        _.set(state, 'vifs.columnChart.series[0].dataSource.datasetUid', 'exam-ples');
        _.set(state, 'vifs.columnChart.series[0].dataSource.domain', 'example.com');

        expect(
          selector.isValidColumnChartVif(state)
        ).to.be.true;
      });
    });

    describe('when it is invalid', function() {
      it('returns false', function() {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'featureMap';

        expect(
          selector.isValidColumnChartVif(state)
        ).to.be.false;
      });
    });
  });

  describe('isValidFeatureMapVif', function() {
    describe('when it is valid', function() {
      it('returns true', function() {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'featureMap';

        _.set(state, 'vifs.featureMap.series[0].dataSource.dimension.columnName', 'example_dimension');
        _.set(state, 'vifs.featureMap.series[0].dataSource.datasetUid', 'exam-ples');
        _.set(state, 'vifs.featureMap.series[0].dataSource.domain', 'example.com');

        expect(
          selector.isValidFeatureMapVif(state)
        ).to.be.true;
      });
    });

    describe('when it is invalid', function() {
      it('returns false', function() {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'columnChart';

        expect(
          selector.isValidFeatureMapVif(state)
        ).to.be.false;
      });
    });
  });

  describe('isValidTimelineChartVif', function() {
    describe('when it is valid', function() {
      it('returns true', function() {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'timelineChart';

        _.set(state, 'vifs.timelineChart.series[0].dataSource.dimension.columnName', 'example_dimension');
        _.set(state, 'vifs.timelineChart.series[0].dataSource.datasetUid', 'exam-ples');
        _.set(state, 'vifs.timelineChart.series[0].dataSource.domain', 'example.com');

        expect(
          selector.isValidTimelineChartVif(state)
        ).to.be.true;
      });
    });

    describe('when it is invalid', function() {
      it('returns false', function() {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'columnChart';

        expect(
          selector.isValidTimelineChartVif(state)
        ).to.be.false;
      });
    });
  });

  describe('getMeasureAxisMinValue', () => {
    it('should return correct value', () => {
      const state = getDefaultState();
      _.set(state, 'vifs.columnChart.configuration.measureAxisMinValue', 10);

      expect(selector.getMeasureAxisMinValue(state)).to.eq(10);
    });

    it('should return null if it isn\'t defined', () => {
      const state = getDefaultState();

      expect(selector.getMeasureAxisMinValue(state)).to.eq(null);
    });
  });

  describe('getMeasureAxisMaxValue', () => {
    it('should return correct value', () => {
      const state = getDefaultState();
      _.set(state, 'vifs.columnChart.configuration.measureAxisMaxValue', 10);

      expect(selector.getMeasureAxisMaxValue(state)).to.eq(10);
    });

    it('should return null if it isn\'t defined', () => {
      const state = getDefaultState();

      expect(selector.getMeasureAxisMaxValue(state)).to.eq(null);
    });
  });

});
