import React from 'react';
import TestUtils from 'react-dom/test-utils';
import _ from 'lodash';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import vifs from 'common/authoring_workflow/vifs';
import { BasemapPane } from 'common/authoring_workflow/components/panes/BasemapPane';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'common/authoring_workflow/constants';

function createVifAuthoring(type) {
  return {
    authoring: {
      selectedVisualizationType: type
    },
    vifs: { ...vifs }
  };
}

function render(type) {
  const props = defaultProps({
    vifAuthoring: createVifAuthoring(type),
    onChangeBaseMapOpacity: sinon.spy(),
    onSelectBaseMapStyle: sinon.spy(),
    onChangeGeoCoderControl: sinon.spy(),
    onChangeGeoLocateControl: sinon.spy(),
    onChangeNavigationControl: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(BasemapPane, props)
  };
}

describe('BasemapPane', () => {
  let component;
  let props;

  function setUpVisualization(type) {
    return () => {
      var renderedParts = render(type);

      component = renderedParts.component;
      props = renderedParts.props;
    };
  }

  function emitsEvent(selector, eventName, eventType) {
    it(`should emit an ${eventName} event`, function(done) {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(selector));

      setTimeout(() => {
        sinon.assert.calledOnce(props[eventName]);
        done();
      }, INPUT_DEBOUNCE_MILLISECONDS);
    });
  }

  describe('without a visualization type', () => {
    beforeEach(setUpVisualization(null));

    describe('rendering', () => {
      it('renders an empty pane info message', () => {
        expect(component.querySelector('.authoring-empty-pane')).to.exist;
      });
    });
  });

  describe('with map visualization type', () => {
    beforeEach(setUpVisualization('map'));

    describe('rendering', () => {
      it('renders basemap style', () => {
        expect(component.querySelector('#base-map-style')).to.exist;
      });

      it('renders a show geo coder checkbox', () => {
        expect(component.querySelector('#geo_coder_control[type="checkbox"]')).to.exist;
      });

      it('renders a show geo locate checkbox', () => {
        expect(component.querySelector('#geo_locate_control[type="checkbox"]')).to.exist;
      });

      it('renders a show navigation control checkbox', () => {
        expect(component.querySelector('#navigation_control[type="checkbox"]')).to.exist;
      });
    });

    describe('events', () => {
      describe('when changing the basemap style', () => {
        emitsEvent('#base-map-style .picklist-option', 'onSelectBaseMapStyle', 'click');
      });

      describe('when changing the show geo coder', () => {
        it('should emit an onChangeGeoCoderControl event', () => {
          var checkbox = component.querySelector('#geo_coder_control[type="checkbox"]');

          TestUtils.Simulate.change(checkbox);
          sinon.assert.calledOnce(props.onChangeGeoCoderControl);
        });
      });

      describe('when changing the show geo locate', () => {
        it('should emit an onChangeGeoLocateControl event', () => {
          var checkbox = component.querySelector('#geo_locate_control[type="checkbox"]');

          TestUtils.Simulate.change(checkbox);
          sinon.assert.calledOnce(props.onChangeGeoLocateControl);
        });
      });

      describe('when changing the navigation control', () => {
        it('should emit an onChangeNavigationControl event', () => {
          var checkbox = component.querySelector('#navigation_control[type="checkbox"]');

          TestUtils.Simulate.change(checkbox);
          sinon.assert.calledOnce(props.onChangeNavigationControl);
        });
      });
    });
  });
});
