import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import vifs from 'src/authoringWorkflow/vifs';
import { AxisAndScalePane } from 'src/authoringWorkflow/panes/AxisAndScalePane';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onChangeLabelTop: sinon.spy(),
    onChangeLabelBottom: sinon.spy(),
    onChangeLabelLeft: sinon.spy(),
    onChangeLabelRight: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(AxisAndScalePane, props)
  };
}

describe('AxisAndScalePane', function() {
  var component;
  var props;

  function setUpVisualization(type) {
    return function() {
      var renderedParts = render(type);

      component = renderedParts.component;
      props = renderedParts.props;
    };
  }

  function emitsEvent(id, eventName) {
    it(`should emit an ${eventName} event`, function() {
      TestUtils.Simulate.change(component.querySelector(id));
      sinon.assert.calledOnce(props[eventName]);
    });
  }

  function rendersLabelsAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a top label input', function() {
        expect(component.querySelector('#label-top')).to.exist;
      });

      it('renders a bottom label input', function() {
        expect(component.querySelector('#label-bottom')).to.exist;
      });

      it('renders a left label input', function() {
        expect(component.querySelector('#label-left')).to.exist;
      });

      it('renders a right label input', function() {
        expect(component.querySelector('#label-right')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the top label', function() {
        emitsEvent('#label-top', 'onChangeLabelTop');
      });

      describe('when changing the bottom label', function() {
        emitsEvent('#label-bottom', 'onChangeLabelBottom');
      });

      describe('when changing the left label', function() {
        emitsEvent('#label-left', 'onChangeLabelLeft');
      });

      describe('when changing the right label', function() {
        emitsEvent('#label-right', 'onChangeLabelRight');
      });
    });
  }

  describe('columnChart', function() {
    beforeEach(setUpVisualization('columnChart'));
    rendersLabelsAndEmitsEvents();
  });

  describe('histogram', function() {
    beforeEach(setUpVisualization('histogram'));
    rendersLabelsAndEmitsEvents();
  });

  describe('timelineChart', function() {
    beforeEach(setUpVisualization('timelineChart'));
    rendersLabelsAndEmitsEvents();
  });
});
