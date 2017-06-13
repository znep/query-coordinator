import _ from 'lodash';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import { FeatureFlags } from 'socrata-utils';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import vifs from 'src/authoringWorkflow/vifs';
import { LegendsAndFlyoutsPane } from 'src/authoringWorkflow/components/panes/LegendsAndFlyoutsPane';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'src/authoringWorkflow/constants';

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
      expect(component.querySelector('#units-one')).to.exist;
    });

    it('renders a units other input', function() {
      expect(component.querySelector('#units-other')).to.exist;
    });
  }

  function emitsEventsForUnits() {
    describe('when changing the units for one', function() {
      emitsEvent('#units-one', 'onChangeUnitOne');
    });

    describe('when changing the units for other', function() {
      emitsEvent('#units-other', 'onChangeUnitOther');
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
        expect(component.querySelector('.authoring-empty-pane')).to.exist;
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
        expect(component.querySelector('#flyout-title-column')).to.exist;
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
});
