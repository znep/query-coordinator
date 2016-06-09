import vifs from 'src/authoringWorkflow/vifs';
import * as selector from 'src/authoringWorkflow/selectors/vifAuthoring';

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

  describe('isChoroplethMap', function() {
    describe('when it is a choropleth map', function() {
      it('returns true', function() {
        var state = getDefaultState();
        state.authoring.selectedVisualizationType = 'choroplethMap';

        expect(
          selector.isChoroplethMap(state)
        ).to.be.true;
      });
    });

    describe('when it is not a choropleth map', function() {
      it('returns false', function() {
        var state = getDefaultState();
        state.authoring.selectedVisualizationType = 'featureMap';

        expect(
          selector.isChoroplethMap(state)
        ).to.be.false;
      });
    });
  });

  describe('isValidChoroplethMapVif', function() {
    describe('when it is valid', function() {
      it('returns true', function() {
        var state = getDefaultState();
        state.authoring.selectedVisualizationType = 'choroplethMap';

        _.set(state, 'vifs.choroplethMap.configuration.computedColumnName', '@computed_column');
        _.set(state, 'vifs.choroplethMap.configuration.shapefile.uid', 'four-four');
        _.set(state, 'vifs.choroplethMap.series[0].dataSource.dimension.columnName', 'example_dimension');
        _.set(state, 'vifs.choroplethMap.series[0].dataSource.measure.aggregationFunction', 'sum');
        _.set(state, 'vifs.choroplethMap.series[0].dataSource.datasetUid', 'exam-ples');
        _.set(state, 'vifs.choroplethMap.series[0].dataSource.domain', 'example.com');

        expect(
          selector.isValidChoroplethMapVif(state)
        ).to.be.true;
      });
    });

    describe('when it is invalid', function() {
      it('returns false', function() {
        var state = getDefaultState();
        state.authoring.selectedVisualizationType = 'featureMap';

        expect(
          selector.isValidChoroplethMapVif(state)
        ).to.be.false;
      });
    });
  });

  describe('isValidColumnChartVif', function() {
    describe('when it is valid', function() {
      it('returns true', function() {
        var state = getDefaultState();
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
        var state = getDefaultState();
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
        var state = getDefaultState();
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
        var state = getDefaultState();
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
        var state = getDefaultState();
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
        var state = getDefaultState();
        state.authoring.selectedVisualizationType = 'columnChart';

        expect(
          selector.isValidTimelineChartVif(state)
        ).to.be.false;
      });
    });
  });
});
