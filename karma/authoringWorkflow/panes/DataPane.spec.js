import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { DataPane } from 'src/authoringWorkflow/panes/DataPane';
import defaultMetadata from 'src/authoringWorkflow/defaultMetadata';
import vifs from 'src/authoringWorkflow/vifs';

describe('DataPane', function() {
  var component;

  beforeEach(function() {
    component = renderComponent(DataPane, defaultProps());
  });

  describe('rendering', function() {
    describe('without data', function() {
      beforeEach(function() {
        var props = defaultProps();
        props.metadata.data = null;
        component = renderComponent(DataPane, props);
      });

      it('does not render dropdowns', function() {
        expect(component.querySelectorAll('select').length).to.equal(0);
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        var props = defaultProps();
        props.metadata.data = {};

        component = renderComponent(DataPane, props);
      });

      it('renders dimension selection', function() {
        expect(component.querySelector('#dimension-selection')).to.exist;
      });

      it('renders measure selection', function() {
        expect(component.querySelector('#measure-selection')).to.exist;
      });

      it('renders measure aggregation selection', function() {
        expect(component.querySelector('#measure-aggregation-selection')).to.exist;
      });

      it('renders visualization type selection', function() {
        expect(component.querySelector('#visualization-type-selection')).to.exist;
      });
    });
  });

  describe('events', function() {
    var props;
    var component;
    var spies = {
      onChangeDimension: sinon.stub(),
      onChangeMeasure: sinon.stub(),
      onChangeMeasureAggregation: sinon.stub(),
      onChangeVisualizationType: sinon.stub(),
      onChangeRegion: sinon.stub()
    };
    var emitsDropdownEvent = function(selector, eventName) {
      it(`should emit an ${eventName} event.`, function() {
        var dropdown = component.querySelector(selector);
        TestUtils.Simulate.change(dropdown);
        sinon.assert.calledOnce(props[eventName]);
      });
    };

    beforeEach(function() {
      props = defaultProps(spies);
      props.metadata.data = {};

      component = renderComponent(DataPane, props);
    });

    describe('when changing the dimension dropdown', function() {
      emitsDropdownEvent('#dimension-selection', 'onChangeDimension');
    });

    describe('when changing the measure dropdown', function() {
      emitsDropdownEvent('#measure-selection', 'onChangeMeasure');
    });

    describe('when changing the measure aggregation dropdown', function() {
      emitsDropdownEvent('#measure-aggregation-selection', 'onChangeMeasureAggregation');
    });

    describe('when changing the visualization type dropdown', function() {
      emitsDropdownEvent('#visualization-type-selection', 'onChangeVisualizationType');
    });

    describe('when rendering a Choropleth map', function() {
      beforeEach(function() {
        props = defaultProps(spies);
        props.metadata.data = {};
        props.metadata.curatedRegions = [{uid: '', fieldName: ''}];
        props.vifAuthoring.authoring.selectedVisualizationType = 'choroplethMap';

        component = renderComponent(DataPane, props);
      });

      describe('when changing the region dropdown', function() {
        emitsDropdownEvent('#region-selection', 'onChangeRegion');
      });
    });
  });
});
