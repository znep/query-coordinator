import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import vifs from 'src/authoringWorkflow/vifs';
import { ColorsAndStylePane } from 'src/authoringWorkflow/components/panes/ColorsAndStylePane';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'src/authoringWorkflow/constants';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onChangeBaseColor: sinon.spy(),
    onSelectBaseLayer: sinon.spy(),
    onChangeBaseLayerOpacity: sinon.spy(),
    onChangePointColor: sinon.spy(),
    onChangePointOpacity: sinon.spy(),
    onChangePointSize: sinon.spy(),
    onSelectColorScale: sinon.spy(),
    onSelectColorPalette: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(ColorsAndStylePane, props)
  };
}

describe('ColorsAndStylePane', function() {
  var component;
  var props;

  function emitsEvent(selector, eventName, eventType) {
    it(`should emit an ${eventName} event`, function(done) {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(selector));

      setTimeout(() => {
        sinon.assert.calledOnce(props[eventName]);
        done();
      }, INPUT_DEBOUNCE_MILLISECONDS);
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
      it('renders color scale', function() {
        expect(component.querySelector('#color-scale')).to.exist;
      });

      it('renders map type', function() {
        expect(component.querySelector('#base-layer')).to.exist;
      });

      it('renders map opacity', function() {
        expect(component.querySelector('#base-layer-opacity')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the color scale', function() {
        emitsEvent('#color-scale .picklist-option', 'onSelectColorScale', 'click');
      });

      describe('when changing the map type', function() {
        emitsEvent('#base-layer .picklist-option', 'onSelectBaseLayer', 'click');
      });
    });
  });

  describe('columnChart', function() {
    beforeEach(function() {
      var renderedParts = render('columnChart');
      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', function() {
      it('renders an input', function() {
        expect(component.querySelector('.color-picker')).to.exist;
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
      it('renders an input', function() {
        expect(component.querySelector('.color-picker')).to.exist;
      });
    });
  });

  describe('featureMap', function() {
    beforeEach(function() {
      var renderedParts = render('featureMap');
      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', function() {
      it('renders point color', function() {
        expect(component.querySelector('.color-picker')).to.exist;
      });

      it('renders point opacity', function() {
        expect(component.querySelector('#point-opacity')).to.exist;
      });

      it('renders point size', function() {
        expect(component.querySelector('#point-size')).to.exist;
      });

      it('renders map type', function() {
        expect(component.querySelector('#base-layer')).to.exist;
      });

      it('renders map opacity', function() {
        expect(component.querySelector('#base-layer-opacity')).to.exist;
      });
    });

    describe('events', function() {
      emitsEvent('#base-layer .picklist-option', 'onSelectBaseLayer', 'click');
    });
  });

  describe('timelineChart', function() {
    beforeEach(function() {
      var renderedParts = render('timelineChart');
      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', function() {
      it('renders an input', function() {
        expect(component.querySelector('.color-picker')).to.exist;
      });
    });
  });

  describe('pieChart', () => {
    beforeEach(() => {
      const renderedParts = render('pieChart');
      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', () => {
      it('renders color palette selection', () => {
        expect(component.querySelector('#color-palette')).to.exist;
      });
    });
  });

});
