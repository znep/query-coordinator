import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { VisualizationTypeSelector } from 'src/authoringWorkflow/components/VisualizationTypeSelector';

describe('VisualizationTypeSelector', function() {
  describe('rendering', function() {
    var component;

    describe('without data', function() {
      beforeEach(function() {
        component = renderComponent(VisualizationTypeSelector, defaultProps({
          metadata: { data: null }
        }));
      });

      it('does not render a dropdown', function() {
        expect(component).to.be.null;
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        component = renderComponent(VisualizationTypeSelector, defaultProps());
      });

      it('renders visualization type selection', function() {
        expect(component.id).to.equal('visualization-type-selection');
      });

      describe('with a visualization selected', function() {
        it('selects the visualization', function() {
          expect(component.querySelector('.btn.active')).to.exist;
        })
      });

      describe('with region map selected and no regions', function() {
        beforeEach(function() {
          var props = defaultProps();

          _.set(props, 'vifAuthoring.authoring.selectedVisualizationType', 'regionMap');
          _.set(props, 'metadata.curatedRegions', []);

          component = renderComponent(VisualizationTypeSelector, props);
        });

        it('renders a warning', function() {
          expect(component.querySelector('#empty-region-selection-alert')).to.exist;
        });
      });

      describe('with a dimension selected', function() {
        beforeEach(function() {
          component = renderComponent(VisualizationTypeSelector, defaultProps({
            vifAuthoring: {
              vifs: {
                columnChart: {
                  series: [{
                    dataSource: {
                      dimension: {
                        columnName: 'test'
                      }
                    }
                  }]
                }
              }
            }
          }));
        });

        it('renders recommended visualizations', function() {
          expect(component.querySelector('.btn.recommended')).to.exist;
        });

        it('renders recommended flyouts', function() {
          expect(component.querySelector('.flyout.recommended')).to.exist;
        });
      });
    });
  });

  describe('events', function() {
    var props;
    var component;
    var overrides = {
      onSelectVisualizationType: sinon.stub(),
      setDimensionToLocation: sinon.stub()
    };

    var emitsDropdownEvent = function(selector, eventName) {
      it(`should emit an ${eventName} event.`, function() {
        var option = component.querySelector(`${selector} .btn`);
        TestUtils.Simulate.click(option);
        sinon.assert.calledOnce(props[eventName]);
      });
    };

    beforeEach(function() {
      props = defaultProps(overrides);
      component = renderComponent(VisualizationTypeSelector, props);
    });

    describe('when changing the visualization type dropdown', function() {
      emitsDropdownEvent('#visualization-type-selection', 'onSelectVisualizationType');
    });

    describe('when selecting a map and the dataset contains a location column', function() {
      beforeEach(function() {
        props = defaultProps(overrides);

        props.metadata.data.columns.push({
          renderTypeName: 'point',
          fieldName: 'location_column',
          name: 'Location Column'
        });

        props.metadata.phidippidesMetadata.columns.location_column = {
          renderTypeName: 'point',
          name: 'Location Column'
        };

        component = renderComponent(VisualizationTypeSelector, props);
      });

      it('emits a setDimensionToLocation event', function() {
        var featureMapButton = component.querySelector('[data-flyout="featureMap-flyout"]');
        TestUtils.Simulate.click(featureMapButton);
        sinon.assert.calledOnce(props.setDimensionToLocation);
      });
    });
  });
});
