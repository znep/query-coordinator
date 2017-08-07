import _ from 'lodash';
import $ from 'jquery';
import VisualizationRenderer from 'common/visualizations/VisualizationRenderer';
import mockVif from './mockVif';

describe('VisualizationRenderer', () => {
  let element;
  let visualization;
  let mockFlyout;

  beforeEach(() => {
    element = document.createElement('div');
    sinon.stub($.fn, 'socrataSvgHistogram', function() {
      $(this).append($('div').text('mock histogram'));
    });
    sinon.stub($.fn, 'socrataSvgColumnChart', () => {});
    mockFlyout = {
      clear: sinon.stub(),
      render: sinon.stub()
    };
  });

  afterEach(() => {
    element.remove();
    $('#socrata-row-inspector').remove();
    $.fn.socrataSvgHistogram.restore();
    $.fn.socrataSvgColumnChart.restore();
  });

  describe('when VIF is missing a visualization type', () => {
    beforeEach(() => {
      visualization = new VisualizationRenderer({}, element);
    });

    afterEach(() => {
      visualization.destroy();
    });

    it('does not initialize a visualization', () => {
      assert.lengthOf($(element).find('.socrata-visualization'), 0);
    });

    it('renders an error message', () => {
      assert.lengthOf($(element).find('.alert.error'), 1);
    });
  });

  describe('when VIF has a visualization type', () => {
    beforeEach(() => {
      visualization = new VisualizationRenderer(
        mockVif,
        element,
        { flyoutRenderer: mockFlyout }
      );
    });

    afterEach(() => {
      visualization.destroy();
    });

    it('initializes a visualization', () => {
      sinon.assert.calledOnce($.fn.socrataSvgHistogram);
      sinon.assert.calledWith($.fn.socrataSvgHistogram, mockVif);
      assert.equal($.fn.socrataSvgHistogram.getCall(0).thisValue[0], element);
    });

    describe('visualization event handling', () => {
      beforeEach(() => {
        sinon.spy($.fn, 'trigger');
      });

      afterEach(() => {
        $.fn.trigger.restore();
      });

      it('triggers the visualization to update on calling update with same VIF type', () => {
        const slightlyChangedMockVif = Object.assign({}, mockVif, {'description': 'Elephants in space wearing suits'});
        visualization.update(slightlyChangedMockVif);
        const triggeredUpdate = _.some($.fn.trigger.getCalls(), (call) => {
          return _.get(call, 'args[0].type') === 'SOCRATA_VISUALIZATION_RENDER_VIF';
        });

        assert.isTrue(triggeredUpdate);
      });

      describe('when called with a different VIF type', () => {
        let mockColumnChartVif;
        beforeEach(() => {
          mockColumnChartVif = _.cloneDeep(mockVif);
          mockColumnChartVif.series[0].type = 'columnChart';

          $.fn.socrataSvgHistogram.reset();
          visualization.update(mockColumnChartVif);
        });

        it('does not call update on existing visualization', () => {
          const triggeredUpdate = _.some($.fn.trigger.getCalls(), (call) => {
            return _.get(call, 'args[0].type') === 'SOCRATA_VISUALIZATION_RENDER_VIF';
          });

          assert.isFalse(triggeredUpdate);
        });

        it('destroys the existing visualization', () => {
          assert.isTrue($.fn.trigger.calledWith('SOCRATA_VISUALIZATION_DESTROY'));
        });

        it('renders a new visualization', () => {
          sinon.assert.notCalled($.fn.socrataSvgHistogram);
          sinon.assert.calledOnce($.fn.socrataSvgColumnChart);
          sinon.assert.calledWith($.fn.socrataSvgColumnChart, mockColumnChartVif);
          assert.equal($.fn.socrataSvgColumnChart.getCall(0).thisValue[0], element);
        });
      });

      it('triggers destroy on unmount', () => {
        visualization.destroy();
        assert.isTrue($.fn.trigger.calledWith('SOCRATA_VISUALIZATION_DESTROY'));
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
      it('invokes the FlyoutRenderer when a flyout is dispatched', () => {
        const flyoutEvent = new $.Event('SOCRATA_VISUALIZATION_FLYOUT');
        flyoutEvent.originalEvent = {
          detail: {
            element: document.createElement('div'),
            content: 'wombats'
          }
        };
        $(element).trigger(flyoutEvent);
        sinon.assert.calledOnce(mockFlyout.render);
        sinon.assert.calledWith(mockFlyout.render, flyoutEvent.originalEvent.detail);
        sinon.assert.notCalled(mockFlyout.clear);
      });

      it('clears the FlyoutRenderer when a null flyout payload is dispatched', () => {
        const flyoutEvent = new $.Event('SOCRATA_VISUALIZATION_FLYOUT');
        flyoutEvent.originalEvent = {
          detail: null
        };
        $(element).trigger(flyoutEvent);
        sinon.assert.calledOnce(mockFlyout.clear);
        sinon.assert.notCalled(mockFlyout.render);
      });
    });
  });
});
