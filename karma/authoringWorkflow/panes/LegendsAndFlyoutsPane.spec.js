import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import vifs from 'src/authoringWorkflow/vifs';
import { LegendsAndFlyoutsPane } from 'src/authoringWorkflow/panes/LegendsAndFlyoutsPane';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onChangeUnitsOne: sinon.spy(),
    onChangeUnitsOther: sinon.spy(),
    onSelectFlyoutTitle: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(LegendsAndFlyoutsPane, props)
  };
}

describe('LegendsAndFlyoutsPane', function() {
  var component;
  var props;

  function emitsEvent(id, eventName, eventType) {
    it(`should emit an ${eventName} event`, function() {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(id));
      sinon.assert.calledOnce(props[eventName]);
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
      emitsEvent('#units-one', 'onChangeUnitsOne');
    });

    describe('when changing the units for other', function() {
      emitsEvent('#units-other', 'onChangeUnitsOther');
    });
  }

  describe('choroplethMap', function() {
    beforeEach(function() {
      var renderedParts = render('choroplethMap');

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
    beforeEach(function() {
      var renderedParts = render('columnChart');

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
      emitsEvent('#flyout-title-column .dropdown-option', 'onSelectFlyoutTitle', 'click');
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
