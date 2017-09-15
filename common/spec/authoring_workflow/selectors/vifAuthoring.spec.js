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

describe('vifAuthoring', () => {
  describe('getCurrentVif', () => {
    it('returns the selectedVisualizationType VIF', () => {
      expect(selector.getCurrentVif(getDefaultState())).to.be.deep.equal(vifs().columnChart);
    });
  });

  describe('getDatasetUid', () => {
    it('returns the current VIF\'s datasetUid', () => {
      expect(
        selector.getDatasetUid(getDefaultState())
      ).to.be.equal(_.get(vifs(), 'columnChart.series[0].dataSource.datasetUid'));
    });
  });

  describe('getDomain', () => {
    it('returns the current VIF\'s domain', () => {
      expect(
        selector.getDomain(getDefaultState())
      ).to.be.equal(_.get(vifs(), 'columnChart.series[0].dataSource.domain'));
    });
  });

  describe('getPrecision', () => {
    it('returns the current VIF\'s precision', () => {
      const state = getDefaultState();
      state.authoring.selectedVisualizationType = 'timelineChart';

      expect(
        selector.getPrecision(state)
      ).to.be.equal(_.get(vifs(), 'timelineChart.series[0].dataSource.precision'));
    });
  });

  describe('getTreatNullValuesAsZero', () => {
    it('returns the current VIF\'s treatNullValuesAsZero property', () => {
      const state = getDefaultState();
      state.authoring.selectedVisualizationType = 'timelineChart';

      expect(
        selector.getTreatNullValuesAsZero(state)
      ).to.be.equal(_.get(vifs(), 'timelineChart.configuration.treatNullValuesAsZero'));
    });
  });

  describe('isRegionMap', () => {
    describe('when it is a region map', () => {
      it('returns true', () => {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'regionMap';

        expect(
          selector.isRegionMap(state)
        ).to.be.true;
      });
    });

    describe('when it is not a region map', () => {
      it('returns false', () => {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'featureMap';

        expect(
          selector.isRegionMap(state)
        ).to.be.false;
      });
    });
  });

  describe('isValidRegionMapVif', () => {
    describe('when it is valid', () => {
      it('returns true', () => {
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

    describe('when it is invalid', () => {
      it('returns false', () => {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'featureMap';

        expect(
          selector.isValidRegionMapVif(state)
        ).to.be.false;
      });
    });
  });

  describe('isValidColumnChartVif', () => {
    describe('when it is valid', () => {
      it('returns true', () => {
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

    describe('when it is invalid', () => {
      it('returns false', () => {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'featureMap';

        expect(
          selector.isValidColumnChartVif(state)
        ).to.be.false;
      });
    });
  });

  describe('isValidFeatureMapVif', () => {
    describe('when it is valid', () => {
      it('returns true', () => {
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

    describe('when it is invalid', () => {
      it('returns false', () => {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'columnChart';

        expect(
          selector.isValidFeatureMapVif(state)
        ).to.be.false;
      });
    });
  });

  describe('isValidTimelineChartVif', () => {
    describe('when it is valid', () => {
      it('returns true', () => {
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

    describe('when it is invalid', () => {
      it('returns false', () => {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'columnChart';

        expect(
          selector.isValidTimelineChartVif(state)
        ).to.be.false;
      });
    });
  });

  describe('isGrouping', () => {
    describe('when it is valid', () => {
      it('returns true', () => {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'timelineChart';

        _.set(state, 'vifs.timelineChart.series[0].dataSource.dimension.columnName', 'example_dimension');
        _.set(state, 'vifs.timelineChart.series[0].dataSource.dimension.grouping.columnName', 'example_grouping');
        _.set(state, 'vifs.timelineChart.series[0].dataSource.datasetUid', 'exam-ples');
        _.set(state, 'vifs.timelineChart.series[0].dataSource.domain', 'example.com');

        expect(
          selector.isGrouping(state)
        ).to.be.true;
      });
    });

    describe('when it is invalid', () => {
      it('returns false', () => {
        const state = getDefaultState();
        state.authoring.selectedVisualizationType = 'timelineChart';
        // Not setting a grouping column.

        expect(
          selector.isGrouping(state)
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
