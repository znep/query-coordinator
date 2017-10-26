import _ from 'lodash';
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';

import { VisualizationPreview } from 'common/authoring_workflow/components/VisualizationPreview';
import vifs from 'common/authoring_workflow/vifs';

import renderComponent from '../renderComponent';

function defaultProps() {
  const vifsCloned = vifs();

  return {
    vifAuthoring: {
      vifs: vifsCloned,
      authoring: {
        selectedVisualizationType: vifsCloned.columnChart.series[0].type
      }
    },
    vif: vifsCloned.columnChart
  };
}

// Replace chart implementations
// with Sinon stubs.
function stubCharts() {
  let originalChartImplementations;
  const stubbedCharts = [
    'socrataSvgBarChart',
    'socrataSvgColumnChart',
    'socrataSvgTimelineChart',
    'socrataSvgHistogram',
    'socrataSvgFeatureMap',
    'socrataSvgRegionMap'
  ];

  beforeEach(() => {
    originalChartImplementations = _.pick($.fn, stubbedCharts);
    stubbedCharts.forEach((fnName) => $.fn[fnName] = sinon.stub());
  });

  afterEach(() => {
    _.assign($.fn, originalChartImplementations);
  });
}

function rendersChartType(props, jqueryFunctionName) {
  it(`calls $.fn.${jqueryFunctionName}`, () => {
    renderComponent(VisualizationPreview, props);
    sinon.assert.calledOnce($.fn[jqueryFunctionName]);
  });
}

function updatesCenterAndZoom(props) {
  it('updates the VIF when SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED is emitted', () => {
    props.onCenterAndZoomChanged = sinon.spy();
    const element = renderComponent(VisualizationPreview, props);

    const newValue = { foo: 'bar' };

    element.dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED',
        {
          detail: newValue,
          bubbles: true
        }
      )
    );
    sinon.assert.calledWithExactly(props.onCenterAndZoomChanged, newValue);
  });
}

describe('VisualizationPreview', () => {
  stubCharts();

  afterEach(() => {
    $('#socrata-row-inspector').remove();
  });

  describe('with a valid vif', () => {
    describe('when rendering a columnChart', () => {
      const props = defaultProps();

      _.set(props, 'vif.series[0].type', 'columnChart');
      _.set(props, 'vif.series[0].dataSource.dimension.columnName', 'example_dimension');
      _.set(props, 'vif.series[0].dataSource.measure.columnName', 'example_measure');
      _.set(props, 'vif.series[0].dataSource.datasetUid', 'exam-ples');
      _.set(props, 'vif.series[0].dataSource.domain', 'example.com');

      rendersChartType(props, 'socrataSvgColumnChart');
    });

    describe('when rendering a barChart', () => {
      const props = defaultProps();

      const emitLabelSizeChangeEvent = (element, newSize) => {
        element.dispatchEvent(
          new window.CustomEvent(
            'SOCRATA_VISUALIZATION_DIMENSION_LABEL_AREA_SIZE_CHANGED',
            {
              detail: newSize,
              bubbles: true
            }
          )
        );
      };

      _.set(props, 'vif.series[0].type', 'barChart');
      _.set(props, 'vif.series[0].dataSource.dimension.columnName', 'example_dimension');
      _.set(props, 'vif.series[0].dataSource.measure.columnName', 'example_measure');
      _.set(props, 'vif.series[0].dataSource.datasetUid', 'exam-ples');
      _.set(props, 'vif.series[0].dataSource.domain', 'example.com');

      rendersChartType(props, 'socrataSvgBarChart');

      it('updates the VIF when SOCRATA_VISUALIZATION_DIMENSION_LABEL_AREA_SIZE_CHANGED is emitted', () => {
        props.onDimensionLabelAreaSizeChanged = sinon.spy();
        const element = renderComponent(VisualizationPreview, props);

        const newSize = 999;
        emitLabelSizeChangeEvent(element, newSize);
        sinon.assert.calledWithExactly(props.onDimensionLabelAreaSizeChanged, newSize);
      });

      it('ignores SOCRATA_VISUALIZATION_DIMENSION_LABEL_AREA_SIZE_CHANGED with invalid payload', () => {
        props.onDimensionLabelAreaSizeChanged = sinon.spy();
        const element = renderComponent(VisualizationPreview, props);

        const newSize = undefined;
        emitLabelSizeChangeEvent(element, newSize);
        sinon.assert.notCalled(props.onDimensionLabelAreaSizeChanged);
      });
    });

    describe('when rendering a histogram', () => {
      const props = defaultProps();

      _.set(props, 'vif.series[0].type', 'histogram');
      _.set(props, 'vif.series[0].dataSource.dimension.columnName', 'example_dimension');
      _.set(props, 'vif.series[0].dataSource.measure.columnName', 'example_measure');
      _.set(props, 'vif.series[0].dataSource.datasetUid', 'exam-ples');
      _.set(props, 'vif.series[0].dataSource.domain', 'example.com');

      rendersChartType(props, 'socrataSvgHistogram');
    });

    describe('when rendering a timelineChart', () => {
      const props = defaultProps();

      _.set(props, 'vif.series[0].type', 'timelineChart');
      _.set(props, 'vif.series[0].dataSource.dimension.columnName', 'example_dimension');
      _.set(props, 'vif.series[0].dataSource.measure.columnName', 'example_measure');
      _.set(props, 'vif.series[0].dataSource.datasetUid', 'exam-ples');
      _.set(props, 'vif.series[0].dataSource.domain', 'example.com');

      rendersChartType(props, 'socrataSvgTimelineChart');
    });

    describe('when rendering a featureMap', () => {
      const props = defaultProps();

      _.set(props, 'vif.series[0].type', 'featureMap');
      _.set(props, 'vif.series[0].dataSource.dimension.columnName', 'example_dimension');
      _.set(props, 'vif.series[0].dataSource.datasetUid', 'exam-ples');
      _.set(props, 'vif.series[0].dataSource.domain', 'example.com');

      rendersChartType(props, 'socrataSvgFeatureMap');
      updatesCenterAndZoom(props);
    });

    describe('when rendering a regionMap', () => {
      const props = defaultProps();

      _.set(props, 'vif.series[0].type', 'regionMap');
      _.set(props, 'vif.configuration.computedColumnName', '@computed_column');
      _.set(props, 'vif.configuration.shapefile.uid', 'four-four');
      _.set(props, 'vif.series[0].dataSource.dimension.columnName', 'example_dimension');
      _.set(props, 'vif.series[0].dataSource.measure.aggregationFunction', 'sum');
      _.set(props, 'vif.series[0].dataSource.datasetUid', 'exam-ples');
      _.set(props, 'vif.series[0].dataSource.domain', 'example.com');

      rendersChartType(props, 'socrataSvgRegionMap');
      updatesCenterAndZoom(props);
    });
  });

  describe('shouldComponentUpdate', () => {
    let container;
    let props;
    let element;
    let shouldComponentUpdateSpy;

    const render = (container, props) => ReactDOM.render(React.createElement(VisualizationPreview, props), container);

    beforeEach(() => {
      shouldComponentUpdateSpy = sinon.spy(VisualizationPreview.prototype, 'shouldComponentUpdate');
      container = document.createElement('div');
      props = defaultProps();

      _.set(props, 'vif.series[0].type', 'regionMap');
      _.set(props, 'vif.configuration.computedColumnName', '@computed_column');
      _.set(props, 'vif.configuration.shapefile.uid', 'four-four');
      _.set(props, 'vif.configuration.mapCenterAndZoom', { center: 10, zoom: 10 });
      _.set(props, 'vif.series[0].dataSource.dimension.columnName', 'example_dimension');
      _.set(props, 'vif.series[0].dataSource.measure.aggregationFunction', 'sum');
      _.set(props, 'vif.series[0].dataSource.datasetUid', 'exam-ples');
      _.set(props, 'vif.series[0].dataSource.domain', 'example.com');

      render(container, props);
    });

    afterEach(() => {
      shouldComponentUpdateSpy.restore();
    });

    it('updates when the VIF changes, but mapCenterAndZoom does not', () => {
      const newProps = _.merge({}, props, {
        vif: {
          configuration: {
            computedColumnName: '@new_computed_column_name'
          }
        }
      });

      render(container, newProps);
      expect(shouldComponentUpdateSpy.returnValues[0]).to.equal(true);
    });

    it('does not update when the VIF changes, and mapCenterAndZoom does', () => {
      const newProps = _.merge({}, props, {
        vif: {
          configuration: {
            computedColumnName: '@new_computed_column_name',
            mapCenterAndZoom: { center: 20, zoom: 20 }
          }
        }
      });

      render(container, newProps);
      expect(shouldComponentUpdateSpy.returnValues[0]).to.equal(false);
    });

    it('does not update when the VIF does not change, and mapCenterAndZoom does', () => {
      const newProps = _.merge({}, props, {
        vif: {
          configuration: {
            mapCenterAndZoom: { center: 20, zoom: 20 }
          }
        }
      });

      render(container, newProps);
      expect(shouldComponentUpdateSpy.returnValues[0]).to.equal(false);
    });

    it('updates when mapCenterAndZoom is undefined in the original VIF', () => {
      _.unset(props, 'vif.configuration.mapCenterAndZoom');
      const newProps = _.cloneDeep(props);
      // make a minor change to the VIF
      _.set(newProps, 'vif.series[0].dataSource.dimension.columnName', 'something_new');
      render(container, newProps);
      expect(shouldComponentUpdateSpy.returnValues[0]).to.equal(true);
    });

    it('updates when the VIF changes and mapCenterAndZoom is undefined in the new VIF', () => {
      const newProps = _.cloneDeep(props);
      _.unset(newProps, 'vif.configuration.mapCenterAndZoom');
      // make a minor change to the VIF
      _.set(newProps, 'vif.series[0].dataSource.dimension.columnName', 'something_new');
      render(container, newProps);
      expect(shouldComponentUpdateSpy.returnValues[0]).to.equal(true);
    });
  });
});
