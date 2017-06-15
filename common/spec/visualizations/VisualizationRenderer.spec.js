import _ from 'lodash';
import $ from 'jquery';
import VisualizationRenderer from 'common/visualizations/VisualizationRenderer';
import mockVif from './mockVif';

describe('VisualizationRenderer', () => {
  let element;
  let visualization;

  beforeEach(() => {
    element = document.createElement('div');
  });

  afterEach(() => {
    element.remove();
    $('#socrata-flyout').remove();
    $('#socrata-row-inspector').remove();
  });

  it('renders an element', () => {
    visualization = new VisualizationRenderer(mockVif, element);
    expect(element.querySelector('.socrata-visualization')).to.exist;
    visualization.destroy();
  });

  describe('when VIF is missing a visualization type', () => {
    beforeEach(() => {
      visualization = new VisualizationRenderer({}, element);
    });

    afterEach(() => {
      visualization.destroy();
    });

    it('does not initialize a visualization', () => {
      expect(element.querySelector('.socrata-visualization')).to.not.exist;
    });

    it('renders an error message', () => {
      expect(element.querySelector('.alert.error')).to.exist;
    });
  });

  describe('when VIF has a visualization type', () => {
    beforeEach(() => {
      visualization = new VisualizationRenderer(mockVif, element);
    });

    afterEach(() => {
      visualization.destroy();
    });

    it('initializes a visualization', () => {
      expect(element.querySelector('.socrata-visualization')).to.exist;
    });

    describe('visualization event handling', () => {
      beforeEach(() => {
        sinon.spy($.fn, 'trigger');
      });

      afterEach(() => {
        $.fn.trigger.restore();
      });

      it('triggers the visualization to update on calling update with same VIF type', () => {
        visualization.update(mockVif);
        const triggeredUpdate = _.some($.fn.trigger.getCalls(), (call) => {
          return _.get(call, 'args[0].type') === 'SOCRATA_VISUALIZATION_RENDER_VIF';
        });

        expect(triggeredUpdate).to.eq(true);
      });

      describe('when called with a different VIF type', () => {
        beforeEach(() => {
          const mockColumnChartVif = _.cloneDeep(mockVif);
          mockColumnChartVif.series[0].type = 'columnChart';

          visualization.update(mockColumnChartVif);
        });

        it('does not call update on existing visualization', () => {
          const triggeredUpdate = _.some($.fn.trigger.getCalls(), (call) => {
            return _.get(call, 'args[0].type') === 'SOCRATA_VISUALIZATION_RENDER_VIF';
          });

          expect(triggeredUpdate).to.eq(false);
        });

        it('destroys the existing visualization', () => {
          expect($.fn.trigger.calledWith('SOCRATA_VISUALIZATION_DESTROY')).to.eq(true);
        });

        it('renders a new visualization', () => {
          expect(element.querySelector('.socrata-visualization')).to.exist;
        });
      });

      it('triggers destroy on unmount', () => {
        visualization.destroy();
        expect($.fn.trigger.calledWith('SOCRATA_VISUALIZATION_DESTROY')).to.eq(true);
      });
    });

    describe('row inspector', () => {
      it('initializes if VIF type is a feature map', () => {
        const mockFeatureMapVif = _.cloneDeep(mockVif);
        mockFeatureMapVif.series[0].type = 'featureMap';

        // stubbing this because featureMap rendering can be noisy
        const originalFeatureMap = $.fn.socrataSvgFeatureMap;
        $.fn.socrataSvgFeatureMap = sinon.stub();

        visualization.update(mockFeatureMapVif);

        expect(document.querySelector('#socrata-row-inspector')).to.exist;

        $.fn.socrataSvgFeatureMap = originalFeatureMap;
      });

      it('does not initialize if VIF type is not a feature map', () => {
        expect(document.querySelector('#socrata-row-inspector')).to.not.exist;
      });
    });

    describe('flyouts', () => {
      it('initializes FlyoutRenderer', () => {
        expect(document.querySelector('#socrata-flyout')).to.exist;
      });

      it('invokes the FlyoutRenderer when a flyouts is dispatched', () => {
        const flyoutEvent = new $.Event('SOCRATA_VISUALIZATION_FLYOUT');
        flyoutEvent.originalEvent = {
          detail: {
            element: document.createElement('div'),
            content: 'wombats'
          }
        };
        $(element).trigger(flyoutEvent);
        const flyout = document.querySelector('#socrata-flyout');

        expect(flyout.classList.contains('visible')).to.eq(true);
        expect(flyout.querySelector('.socrata-flyout-content').innerText).to.eq('wombats');
      });

      it('clears the FlyoutRenderer when a null flyout payload is dispatched', () => {
        const flyoutEvent = new $.Event('SOCRATA_VISUALIZATION_FLYOUT');
        flyoutEvent.originalEvent = {
          detail: null
        };
        $(element).trigger(flyoutEvent);
        const flyout = document.querySelector('#socrata-flyout');

        expect(flyout.classList.contains('visible')).to.eq(false);
        expect(flyout.querySelector('.socrata-flyout-content').innerText).to.eq('');
      });
    });
  });
});
