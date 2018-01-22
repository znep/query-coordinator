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
import { getInputDebounceMs } from 'common/authoring_workflow/constants';

function render(type, props) {
  props = _.merge({}, defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onChangeUnitOne: sinon.spy(),
    onChangeUnitOther: sinon.spy(),
    onSelectRowInspectorTitle: sinon.spy(),
    onSelectMapsFlyoutTitle: sinon.spy(),
    metadata: { domain: 'example.com', datasetUid: 'four-four', data: { columns: [] } }
  }), props);

  return {
    props: props,
    component: renderComponent(LegendsAndFlyoutsPane, props)
  };
}

describe('LegendsAndFlyoutsPane', () => {
  var component;
  var props;

  beforeEach(() => {
    I18n.translations.en = allLocales.en;
  });

  afterEach(() => {
    I18n.translations = {};
  });

  function emitsEvent(id, eventName, eventType) {
    it(`should emit an ${eventName} event`, (done) => {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(id));

      setTimeout(() => {
        sinon.assert.calledOnce(props[eventName]);
        done();
      }, getInputDebounceMs());
    });
  }

  function rendersEditableUnits() {
    it('renders a units one input', () => {
      assert.isNotNull(component.querySelector('#units-one-0'));
    });

    it('renders a units other input', () => {
      assert.isNotNull(component.querySelector('#units-other-0'));
    });
  }

  function emitsEventsForUnits() {
    describe('when changing the units for one', () => {
      emitsEvent('#units-one-0', 'onChangeUnitOne');
    });

    describe('when changing the units for other', () => {
      emitsEvent('#units-other-0', 'onChangeUnitOther');
    });
  }

  describe('without a visualization type', () => {
    beforeEach(() => {
      var renderedParts = render(null);

      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', () => {
      it('renders an empty pane info message', () => {
        assert.isNotNull(component.querySelector('.authoring-empty-pane'));
      });
    });
  });

  describe('regionMap', () => {
    beforeEach(() => {
      var renderedParts = render('regionMap');

      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', () => {
      rendersEditableUnits();
    });

    describe('events', () => {
      emitsEventsForUnits();
    });
  });

  describe('columnChart', () => {
    let legendsPanel;
    let flyoutDetailsPanel;

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
      legendsPanel = component.querySelector('[aria-label=Legends]');
      flyoutDetailsPanel = component.querySelector('[aria-label="Flyout Details"]');
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

      _.set(
        props,
        'vifAuthoring.vifs.columnChart.series[0].type',
        'columnChart'
      );

      _.set(
        props,
        'vifAuthoring.vifs.columnChart.series[1].type',
        'columnChart'
      );

      var renderedParts = render('columnChart', props);
      component = renderedParts.component;
      props = renderedParts.props;
    }

    beforeEach(() => { renderColumnChartPane(false); });

    describe('rendering', () => {
      rendersEditableUnits();
    });

    describe('events', () => {
      emitsEventsForUnits();
    });

    describe('not grouping', () => {
      it('does not render the legend pane', () => {
        renderColumnChartPane(false);
        assert.isNull(legendsPanel);
      });

      it('renders the flyout details pane', () => {
        renderColumnChartPane(false);
        assert.isNotNull(flyoutDetailsPanel);
      });
    });

    describe('grouping', () => {
      it('renders the legend pane', () => {
        renderColumnChartPane(true);
        assert.isNotNull(legendsPanel);
      });

      it('does not render the flyout details pane', () => {
        renderColumnChartPane(true);
        assert.isNull(flyoutDetailsPanel);
      });
    });

    describe('multi-series', () => {
      it('renders multiple units containers', () => {
        renderMultiSeriesColumnChartPane();
        assert.isNotNull(component.querySelector('#units-container-0'));
        assert.isNotNull(component.querySelector('#units-container-1'));
      });

      it('renders the flyout details pane', () => {
        renderColumnChartPane(false);
        assert.isNotNull(flyoutDetailsPanel);
      });
    });
  });

  describe('histogram', () => {
    let flyoutDetailsPanel;

    beforeEach(() => {
      let renderedParts = render('histogram');
      component = renderedParts.component;
      props = renderedParts.props;
      flyoutDetailsPanel = component.querySelector('[aria-label="Flyout Details"]');
    });

    describe('rendering', () => {
      rendersEditableUnits();

      it('does not render the flyout details pane', () => {
        assert.isNull(flyoutDetailsPanel);
      });
    });

    describe('events', () => {
      emitsEventsForUnits();
    });
  });

  describe('featureMap', () => {
    let flyoutDetailsPanel;

    beforeEach(() => {
      let renderedParts = render('featureMap');
      component = renderedParts.component;
      props = renderedParts.props;
      flyoutDetailsPanel = component.querySelector('[aria-label="Flyout Details"]');
    });

    describe('rendering', () => {
      rendersEditableUnits();

      it('should render a dropdown with columns', () => {
        assert.isNotNull(component.querySelector('#flyout-title-column'));
      });

      it('does not render the flyout details pane', () => {
        assert.isNull(flyoutDetailsPanel);
      });
    });

    describe('events', () => {
      emitsEventsForUnits();
      emitsEvent('#flyout-title-column .picklist-option', 'onSelectRowInspectorTitle', 'click');
    });
  });

  describe('newMap', () => {
    beforeEach(() => {
      var renderedParts = render('map');

      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', () => {
      rendersEditableUnits();

      it('should render a dropdown with columns', () => {
        assert.isNotNull(component.querySelector('#flyout-title-column'));
      });
    });

    describe('events', () => {
      emitsEventsForUnits();
      emitsEvent('#flyout-title-column .picklist-option', 'onSelectMapsFlyoutTitle', 'click');
    });
  });

  describe('timelineChart', () => {
    let flyoutDetailsPanel;

    beforeEach(() => {
      let renderedParts = render('timelineChart');
      component = renderedParts.component;
      props = renderedParts.props;
      flyoutDetailsPanel = component.querySelector('[aria-label="Flyout Details"]');
    });

    describe('rendering', () => {
      rendersEditableUnits();

      it('renders the flyout details pane', () => {
        assert.isNotNull(flyoutDetailsPanel);
      });
    });

    describe('events', () => {
      emitsEventsForUnits();
    });
  });

  describe('multi-series timelineChart', () => {
    let flyoutDetailsPanel;

    beforeEach(() => {
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

      _.set(
        props,
        'vifAuthoring.vifs.timelineChart.series[0].type',
        'columnChart'
      );

      _.set(
        props,
        'vifAuthoring.vifs.timelineChart.series[1].type',
        'columnChart'
      );

      var renderedParts = render('timelineChart', props);
      component = renderedParts.component;
      props = renderedParts.props;
      flyoutDetailsPanel = component.querySelector('[aria-label="Flyout Details"]');
    });

    describe('multi-series', () => {
      it('renders multiple units containers', () => {
        assert.isNotNull(component.querySelector('#units-container-0'));
        assert.isNotNull(component.querySelector('#units-container-1'));
      });

      it('renders the flyout details pane', () => {
        assert.isNotNull(flyoutDetailsPanel);
      });
    });
  });

  describe('barChart', () => {
    let flyoutDetailsPanel;

    beforeEach(() => {
      let renderedParts = render('barChart');
      component = renderedParts.component;
      props = renderedParts.props;
      flyoutDetailsPanel = component.querySelector('[aria-label="Flyout Details"]');
    });

    describe('rendering', () => {
      it('renders the flyout details pane', () => {
        assert.isNotNull(flyoutDetailsPanel);
      });
    });
  });

  describe('pieChart', () => {
    let flyoutDetailsPanel;

    beforeEach(() => {
      let renderedParts = render('pieChart');
      component = renderedParts.component;
      props = renderedParts.props;
      flyoutDetailsPanel = component.querySelector('[aria-label="Flyout Details"]');
    });

    describe('rendering', () => {
      it('renders the flyout details pane', () => {
        assert.isNotNull(flyoutDetailsPanel);
      });
    });
  });

  describe('comboChart', () => {
    let flyoutDetailsPanel;

    beforeEach(() => {
      let renderedParts = render('comboChart');
      component = renderedParts.component;
      props = renderedParts.props;
      flyoutDetailsPanel = component.querySelector('[aria-label="Flyout Details"]');
    });

    describe('rendering', () => {
      it('renders the flyout details pane', () => {
        assert.isNotNull(flyoutDetailsPanel);
      });
    });
  });
});
