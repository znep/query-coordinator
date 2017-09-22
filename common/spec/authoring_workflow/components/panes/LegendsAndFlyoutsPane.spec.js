import _ from 'lodash';
import React from 'react';
import TestUtils from 'react-dom/test-utils';
import { FeatureFlags } from 'common/feature_flags';
import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import vifs from 'common/authoring_workflow/vifs';
import { LegendsAndFlyoutsPane } from 'common/authoring_workflow/components/panes/LegendsAndFlyoutsPane';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'common/authoring_workflow/constants';

function render(type, props) {
  props = _.merge({}, defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onChangeUnitOne: sinon.spy(),
    onChangeUnitOther: sinon.spy(),
    onSelectRowInspectorTitle: sinon.spy(),
    metadata: { domain: 'example.com', datasetUid: 'four-four', data: { columns: [] } }
  }), props);

  return {
    props: props,
    component: renderComponent(LegendsAndFlyoutsPane, props)
  };
}

describe('LegendsAndFlyoutsPane', function() {
  var component;
  var props;

  beforeEach(() => {
    I18n.translations.en = allLocales.en;
  });

  afterEach(() => {
    I18n.translations = {};
  });

  function emitsEvent(id, eventName, eventType) {
    it(`should emit an ${eventName} event`, function(done) {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(id));

      setTimeout(() => {
        sinon.assert.calledOnce(props[eventName]);
        done();
      }, INPUT_DEBOUNCE_MILLISECONDS);
    });
  }

  function rendersEditableUnits() {
    it('renders a units one input', function() {
      assert.isNotNull(component.querySelector('#units-one-0'));
    });

    it('renders a units other input', function() {
      assert.isNotNull(component.querySelector('#units-other-0'));
    });
  }

  function emitsEventsForUnits() {
    describe('when changing the units for one', function() {
      emitsEvent('#units-one-0', 'onChangeUnitOne');
    });

    describe('when changing the units for other', function() {
      emitsEvent('#units-other-0', 'onChangeUnitOther');
    });
  }

  describe('without a visualization type', function() {
    beforeEach(function() {
      var renderedParts = render(null);

      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', function() {
      it('renders an empty pane info message', function() {
        assert.isNotNull(component.querySelector('.authoring-empty-pane'));
      });
    });
  });

  describe('regionMap', function() {
    beforeEach(function() {
      var renderedParts = render('regionMap');

      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', function() {
      rendersEditableUnits();
    });

    describe('events', function() {
      emitsEventsForUnits();
    });
  });

  describe('columnChart', function() {
    var legendsPanel;

    function renderColumnChartPane(isGrouping) {
      props = {};

      if (isGrouping) {
        _.set(
          props,
          'vifAuthoring.vifs.columnChart.series[0].dataSource.dimension.grouping.columnName',
          'something'
        );
      }

      var renderedParts = render('columnChart', props);
      component = renderedParts.component;
      props = renderedParts.props;
      legendsPanel = component.querySelector('[aria-label=Legends]')
    }

    function renderMultiSeriesColumnChartPane() {
      props = {};

      _.set(
        props,
        'vifAuthoring.vifs.columnChart.series[0].dataSource.measure.columnName',
        'something'
      );

      _.set(
        props,
        'vifAuthoring.vifs.columnChart.series[1].dataSource.measure.columnName',
        'something'
      );

      var renderedParts = render('columnChart', props);
      component = renderedParts.component;
      props = renderedParts.props;
    }

    beforeEach(function() { renderColumnChartPane(false); });

    describe('rendering', function() {
      rendersEditableUnits();
    });

    describe('events', function() {
      emitsEventsForUnits();
    });

    describe('not grouping', function() {
      it('does not render the legend pane', function() {
        renderColumnChartPane(false);
        assert.isNull(legendsPanel);
      });
    });

    describe('grouping', function() {
      it('renders the legend pane', function() {
        renderColumnChartPane(true);
        assert.isNotNull(legendsPanel);
      });
    });

    describe('multi-series', function() {
      it('renders multiple units containers', function() {
        renderMultiSeriesColumnChartPane();
        assert.isNotNull(component.querySelector('#units-container-0'));
        assert.isNotNull(component.querySelector('#units-container-1'));
      });
    });
  });

  describe('histogram', function() {
    beforeEach(function() {
      var renderedParts = render('histogram');

      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', function() {
      rendersEditableUnits();
    });

    describe('events', function() {
      emitsEventsForUnits();
    });
  });

  describe('featureMap', function() {
    beforeEach(function() {
      var renderedParts = render('featureMap');

      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', function() {
      rendersEditableUnits();

      it('should render a dropdown with columns', function() {
        assert.isNotNull(component.querySelector('#flyout-title-column'));
      });
    });

    describe('events', function() {
      emitsEventsForUnits();
      emitsEvent('#flyout-title-column .picklist-option', 'onSelectRowInspectorTitle', 'click');
    });
  });

  describe('timelineChart', function() {

    beforeEach(function() {
      var renderedParts = render('timelineChart');
      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', function() {
      rendersEditableUnits();
    });

    describe('events', function() {
      emitsEventsForUnits();
    });
  });

  describe('multi-series timelineChart', function() {

    beforeEach(function() {
      props = {};

      _.set(
        props,
        'vifAuthoring.vifs.timelineChart.series[0].dataSource.measure.columnName',
        'something'
      );

      _.set(
        props,
        'vifAuthoring.vifs.timelineChart.series[1].dataSource.measure.columnName',
        'something'
      );

      var renderedParts = render('timelineChart', props);
      component = renderedParts.component;
      props = renderedParts.props;
    });
    
    describe('multi-series', function() {
      it('renders multiple units containers', function() {
        assert.isNotNull(component.querySelector('#units-container-0'));
        assert.isNotNull(component.querySelector('#units-container-1'));
      });
    });
  });
});
