import { assert } from 'chai';
import sinon from 'sinon';
import { VisualizationWrapper } from 'visualizationCanvas/components/VisualizationWrapper';
import mockVif from 'data/mockVif';

describe('VisualizationWrapper', () => {
  beforeEach(() => {
    sinon.stub($.fn, 'socrataSvgHistogram');
  });

  afterEach(() => {
    $.fn.socrataSvgHistogram.restore();
  });

  const getProps = (props) => (
    {
      vif: mockVif,
      vifIndex: 0,
      ...props
    }
  );

  const getMapNotification = (element) => element.querySelector('.visualization-notification-container');
  const getEditButton = (element) => element.querySelector('.edit-visualization-button');
  const getShareButton = (element) => element.querySelector('.share-visualization-button');

  it('renders nothing if vif is empty', () => {
    const element = renderComponent(VisualizationWrapper, getProps({ vif: {} }));
    assert.isNull(element);
  });

  it('renders a visualization', () => {
    const element = renderComponent(VisualizationWrapper, getProps());
    sinon.assert.calledOnce($.fn.socrataSvgHistogram);
  });

  it('does not display a map notification for non-map visualizations', () => {
    const element = renderComponent(VisualizationWrapper, getProps());
    assert.isNull(getMapNotification(element));
  });

  describe('edit button', () => {
    it('does not render when isEditable is false', () => {
      const element = renderComponentWithStore(VisualizationWrapper, getProps({
        isEditable: false
      }));
      assert.isNull(getEditButton(element));
    });

    it('renders when isEditable is true', () => {
      const element = renderComponentWithStore(VisualizationWrapper, getProps({
        isEditable: true
      }));
      assert.isNotNull(getEditButton(element));
    });
  });

  describe('share button', () => {
    it('does not render when displayShareButton is false', () => {
      const element = renderComponentWithStore(VisualizationWrapper, getProps({
        displayShareButton: false
      }));
      assert.isNull(getShareButton(element));
    });

    it('renders when displayShareButton is true', () => {
      const element = renderComponentWithStore(VisualizationWrapper, getProps({
        displayShareButton: true
      }));
      assert.isNotNull(getShareButton(element));
    });
  });

  describe('when rendering a map visualization', () => {
    let mapVif;

    beforeEach(() => {
      mapVif = _.cloneDeep(mockVif);
      mapVif.series[0].type = 'featureMap';
      sinon.stub($.fn, 'socrataSvgFeatureMap');
    });

    afterEach(() => {
      $.fn.socrataSvgFeatureMap.restore();
    });

    it('displays a map notification', () => {
      const element = renderComponentWithStore(VisualizationWrapper, getProps({
        vif: mapVif,
        isEditable: true
      }));
      assert.isNotNull(getMapNotification(element));
    });

    it('calls onMapNotificationDismiss when notification is dismissed', () => {
      const spy = sinon.spy();
      const element = renderComponentWithStore(VisualizationWrapper, getProps({
        vif: mapVif,
        isEditable: true,
        onMapNotificationDismiss: spy
      }));
      TestUtils.Simulate.click(getMapNotification(element).querySelector('button'));

      sinon.assert.calledOnce(spy);
    });

    describe('onMapCenterAndZoomChange', () => {
      const emitZoomChange = (element) => {
        element.dispatchEvent(
          new window.CustomEvent(
            'SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED',
            { detail: { center: { lat: 33, lng: -92 }, zoom: 8 }, bubbles: true }
          )
        );
      };

      it('is invoked on center/zoom change when in edit mode', () => {
        const spy = sinon.spy();
        const element = renderComponentWithStore(VisualizationWrapper, getProps({
          vif: mapVif,
          isEditable: true,
          onMapCenterAndZoomChange: spy
        }));
        emitZoomChange(element);

        sinon.assert.calledOnce(spy);
      });

      it('is not invoked on center/zoom change when not in edit mode', () => {
        const spy = sinon.spy();
        const element = renderComponentWithStore(VisualizationWrapper, getProps({
          vif: mapVif,
          onMapCenterAndZoomChange: spy
        }));
        emitZoomChange(element);

        sinon.assert.notCalled(spy);
      });
    });

    describe('onMapPitchAndBearingChange', () => {
      const emitPitchAndBearing = (element) => {
        element.dispatchEvent(
          new window.CustomEvent(
            'SOCRATA_VISUALIZATION_PITCH_AND_BEARING_CHANGED',
            { detail: { pitch: 60, zoom: -60 } }
          )
        );
      };

      it('is invoked on pitch and bearing change when in edit mode', () => {
        const spy = sinon.spy();
        const element = renderComponentWithStore(VisualizationWrapper, getProps({
          vif: mapVif,
          isEditable: true,
          onMapPitchAndBearingChange: spy
        }));

        emitPitchAndBearing(element);

        sinon.assert.calledOnce(spy);
      });

      it('is not invoked on pitch and bearing change when not in edit mode', () => {
        const spy = sinon.spy();
        const element = renderComponentWithStore(VisualizationWrapper, getProps({
          vif: mapVif,
          onMapPitchAndBearingChange: spy
        }));

        emitPitchAndBearing(element);

        sinon.assert.notCalled(spy);
      });
    });
  });
});
