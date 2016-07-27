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
        expect(component.querySelectorAll('.dropdown-container').length).to.equal(0);
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

      it('does not render measure aggregation selection', function() {
        expect(component.querySelector('#measure-aggregation-selection')).to.not.exist;
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
      onSelectDimension: sinon.stub(),
      onSelectMeasure: sinon.stub(),
      onSelectMeasureAggregation: sinon.stub(),
      onSelectVisualizationType: sinon.stub(),
      onSelectRegion: sinon.stub()
    };
    var emitsDropdownEvent = function(selector, eventName) {
      it(`should emit an ${eventName} event.`, function() {
        var option = component.querySelector(`${selector} .dropdown-option`);
        TestUtils.Simulate.click(option);
        sinon.assert.calledOnce(props[eventName]);
      });
    };

    beforeEach(function() {
      props = defaultProps(spies);
      props.metadata.data = {};

      component = renderComponent(DataPane, props);
    });

    describe('when changing the dimension dropdown', function() {
      emitsDropdownEvent('#dimension-selection', 'onSelectDimension');
    });

    describe('when changing the measure dropdown', function() {
      emitsDropdownEvent('#measure-selection', 'onSelectMeasure');
    });

    describe('when changing the visualization type dropdown', function() {
      emitsDropdownEvent('#visualization-type-selection', 'onSelectVisualizationType');
    });

    describe('when rendering a Region map', function() {
      beforeEach(function() {
        props = defaultProps(spies);
        props.vifAuthoring.authoring.selectedVisualizationType = 'regionMap';

        component = renderComponent(DataPane, props);
      });

      describe('when changing the region dropdown', function() {
        emitsDropdownEvent('#region-selection', 'onSelectRegion');
      });
    });

    describe('when choosing a measure', function() {
      beforeEach(function() {
        props = defaultProps(spies);

        props.metadata.data = {};
        props.metadata.phidippidesMetadata = {
          columns: {
            'number': {renderTypeName: 'number', name: 'Number'},
          }
        };

        props.vifAuthoring.vifs.columnChart.series[0].dataSource.measure = 'number';

        component = renderComponent(DataPane, props);
      });

      emitsDropdownEvent('#measure-aggregation-selection', 'onSelectMeasureAggregation');
    });
  });
});
