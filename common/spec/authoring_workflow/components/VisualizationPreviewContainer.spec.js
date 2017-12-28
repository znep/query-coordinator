import _ from 'lodash';
import { Simulate } from 'react-dom/test-utils';

import { VisualizationPreviewContainer } from 'common/authoring_workflow/components/VisualizationPreviewContainer';
import vifs from 'common/authoring_workflow/vifs';

import renderComponent from '../renderComponent';
import featureMap from '../testData/featureMap';
import map from '../testData/map';
import columnChart from '../testData/columnChart';

const getGetStartedContainer = (element) => element.querySelector('.get-started-container');
const getMapInfoContainer = (element) => element.querySelector('.visualization-preview-map-info-container');
const getMapInfoDismiss = (element) => element.querySelector('.visualization-preview-map-text-dismiss');
const getProps = () => {
  return {
    dismissMapInfo: _.noop,
    vifAuthoring: {
      vifs: vifs(),
      authoring: {
        selectedVisualizationType: vifs().featureMap.series[0].type,
        mapInfoDismissed: false
      }
    }
  };
};

describe('VisualizationPreviewContainer', () => {
  it('renders a visualization preview container', () => {
    const element = renderComponent(VisualizationPreviewContainer, getProps());
    expect(element).to.have.class('visualization-preview-container');
  });

  it('with an invalid vif renders the get started message <div>', () => {
    const props = getProps();
    _.set(props, 'vifAuthoring.authoring.selectedVisualizationType', null);

    const element = renderComponent(VisualizationPreviewContainer, props);

    expect(getGetStartedContainer(element)).to.exist;
  });

  it('does not render map info for non-map visualization types', () => {
    const props = getProps();
    _.set(props, 'vifAuthoring.vifs.columnChart', columnChart());
    _.set(props, 'vifAuthoring.authoring.selectedVisualizationType', 'columnChart');

    const element = renderComponent(VisualizationPreviewContainer, props);

    expect(getMapInfoContainer(element)).to.not.exist;
  });

  describe('for map visualization types', () => {
    let props;
    let element;

    beforeEach(() => {
      props = getProps();

      _.set(props, 'vifAuthoring.vifs.featureMap', featureMap());
      _.set(props, 'vifAuthoring.authoring.selectedVisualizationType', 'featureMap');
      _.set(props, 'dismissMapInfo', sinon.spy());

      element = renderComponent(VisualizationPreviewContainer, props);
    });

    it('renders map info', () => {
      expect(getMapInfoContainer(element)).to.exist;
    });

    it('fires a click event to close map info', () => {
      Simulate.click(getMapInfoDismiss(element));
      expect(props.dismissMapInfo.called).to.equal(true);
    });
  });

  describe('for new map visualization types', () => {
    let props;
    let element;

    beforeEach(() => {
      props = getProps();

      _.set(props, 'vifAuthoring.vifs.map', map());
      _.set(props, 'vifAuthoring.authoring.selectedVisualizationType', 'map');
      _.set(props, 'dismissMapInfo', sinon.spy());

      element = renderComponent(VisualizationPreviewContainer, props);
    });

    it('renders map info', () => {
      expect(getMapInfoContainer(element)).to.exist;
    });

    it('fires a click event to close map info', () => {
      Simulate.click(getMapInfoDismiss(element));
      expect(props.dismissMapInfo.called).to.equal(true);
    });
  });
});
