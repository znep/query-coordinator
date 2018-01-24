import React from 'react';
import TestUtils from 'react-dom/test-utils';
import _ from 'lodash';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import vifs from 'common/authoring_workflow/vifs';
import { BasemapPane } from 'common/authoring_workflow/components/panes/BasemapPane';
import { getInputDebounceMs } from 'common/authoring_workflow/constants';

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
    onChangeNavigationControl: sinon.spy(),
    onChangeSearchBoundaryUpperLeftLatitude: sinon.spy(),
    onChangeSearchBoundaryUpperLeftLongitude: sinon.spy(),
    onChangeSearchBoundaryLowerRightLatitude: sinon.spy(),
    onChangeSearchBoundaryLowerRightLongitude: sinon.spy()
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
      }, getInputDebounceMs());
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

      it('renders a search boundary upper left latitude input', () => {
        expect(component.querySelector('#upper_left_latitude')).to.exist;
      });

      it('renders a search boundary upper left longitude input', () => {
        expect(component.querySelector('#upper_left_longitude')).to.exist;
      });

      it('renders a search boundary lower right latitude input', () => {
        expect(component.querySelector('#lower_right_latitude')).to.exist;
      });

      it('renders a search boundary lower right longitude input', () => {
        expect(component.querySelector('#lower_right_longitude')).to.exist;
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

      describe('when changing the search boundary upper left latitude input', () => {
        emitsEvent('#upper_left_latitude', 'onChangeSearchBoundaryUpperLeftLatitude');
      });

      describe('when changing the search boundary upper left longitude input', () => {
        emitsEvent('#upper_left_longitude', 'onChangeSearchBoundaryUpperLeftLongitude');
      });

      describe('when changing the search boundary lower right latitude input', () => {
        emitsEvent('#lower_right_latitude', 'onChangeSearchBoundaryLowerRightLatitude');
      });

      describe('when changing the search boundary lower right longitude input', () => {
        emitsEvent('#lower_right_longitude', 'onChangeSearchBoundaryLowerRightLongitude');
      });
    });
  });
});
