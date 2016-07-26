import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import vifs from 'src/authoringWorkflow/vifs';
import { ColorsAndStylePane } from 'src/authoringWorkflow/panes/ColorsAndStylePane';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onChangeBaseColor: sinon.spy(),
    onSelectBaseLayer: sinon.spy(),
    onChangeBaseLayerOpacity: sinon.spy(),
    onChangePointColor: sinon.spy(),
    onChangePointOpacity: sinon.spy(),
    onSelectColorScale: sinon.spy()
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
    it(`should emit an ${eventName} event`, function() {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(selector));
      sinon.assert.calledOnce(props[eventName]);
    });
  }

  describe('choroplethMap', function() {
    beforeEach(function() {
      var renderedParts = render('choroplethMap');
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
        emitsEvent('#color-scale .dropdown-option', 'onSelectColorScale', 'click');
      });

      describe('when changing the map type', function() {
        emitsEvent('#base-layer .dropdown-option', 'onSelectBaseLayer', 'click');
      });

      describe('when changing map opacity', function() {
        emitsEvent('#base-layer-opacity', 'onChangeBaseLayerOpacity');
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

      it('renders map type', function() {
        expect(component.querySelector('#base-layer')).to.exist;
      });

      it('renders map opacity', function() {
        expect(component.querySelector('#base-layer-opacity')).to.exist;
      });
    });

    describe('events', function() {
      emitsEvent('#point-opacity', 'onChangePointOpacity');
      emitsEvent('#base-layer .dropdown-option', 'onSelectBaseLayer', 'click');
      emitsEvent('#base-layer-opacity', 'onChangeBaseLayerOpacity');
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

});
