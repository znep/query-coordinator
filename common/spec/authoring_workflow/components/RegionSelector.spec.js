import React from 'react';
import TestUtils from 'react-dom/test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { RegionSelector } from 'common/authoring_workflow/components/RegionSelector';

const validVifAuthoring = {
  authoring: {
    selectedVisualizationType: 'regionMap'
  },
  vifs: {
    regionMap: {
      series: [
        {
          dataSource: {
            dimension: {
              columnName: 'columnName'
            }
          }
        }
      ]
    }
  }
};

describe('RegionSelector', function() {
  describe('rendering', function() {
    var component;

    describe('without data', function() {
      beforeEach(function() {
        component = renderComponent(RegionSelector, defaultProps());
      });

      it('does not render a dropdown', function() {
        expect(component).to.be.null;
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        component = renderComponent(RegionSelector, defaultProps({
          vifAuthoring: validVifAuthoring
        }));
      });

      it('renders region selection', function() {
        expect(component.querySelector('#region-selection')).to.exist;
      });

      describe('with no regions', function() {
        beforeEach(function() {
          var props = defaultProps({
            vifAuthoring: validVifAuthoring
          });

          _.set(props, 'metadata.curatedRegions', []);

          component = renderComponent(RegionSelector, props);
        });

        it('renders in a disabled state', function() {
          expect(component.querySelector('.dropdown-disabled')).to.exist;
        });
      });

      describe('with active region coding', function() {
        beforeEach(function() {
          var authoring = { showRegionCodingProcessingMessage: true };
          var props = defaultProps({
            vifAuthoring: _.merge(validVifAuthoring, { authoring })
          });

          component = renderComponent(RegionSelector, props);
        });

        it('renders a region coding processing message', function() {
          expect(component.querySelector('.region-processing-info')).to.exist;
        });
      });

      describe('with a region coding error', function() {
        beforeEach(function() {
          var authoring = { regionCodingError: true };
          var props = defaultProps({
            vifAuthoring: _.merge(validVifAuthoring, { authoring })
          });

          component = renderComponent(RegionSelector, props);
        });

        it('renders a region coding error message', function() {
          expect(component.querySelector('.region-processing-error')).to.exist;
        });
      });
    });
  });

  describe('events', function() {
    var props;
    var component;
    var overrides;

    var emitsPicklistEvent = function(selector, eventName) {
      it(`should emit an ${eventName} event.`, function() {
        var option = component.querySelector(`${selector}`);
        TestUtils.Simulate.click(option);
        sinon.assert.calledOnce(props[eventName]);
      });
    };

    beforeEach(function() {
      overrides = {
        vifAuthoring: validVifAuthoring,
        metadata: {
          curatedRegions: [
            { name: 'Curated Region', uid: 'four-five' }
          ],
          data: {
            columns: [
              {
                name: 'Computed Column',
                fieldName: ':@computed_column',
                computationStrategy: {
                  parameters: {
                    region: 'four-four'
                  }
                }
              }
            ]
          }
        },
        onSelectComputedColumn: sinon.stub(),
        onSelectComputedColumnShapefile: sinon.stub(),
        onSelectCuratedRegion: sinon.stub()
      };
      props = defaultProps(overrides);
      component = renderComponent(RegionSelector, props);
    });

    describe('when selecting a computed column', function() {
      emitsPicklistEvent('#region-selection .picklist-option:nth-child(2)', 'onSelectComputedColumn');
      emitsPicklistEvent('#region-selection .picklist-option:nth-child(2)', 'onSelectComputedColumnShapefile');
    });

    describe('when selecting a curated region', function() {
      emitsPicklistEvent('#region-selection .picklist-option:nth-child(5)', 'onSelectCuratedRegion');
    });
  });
});
