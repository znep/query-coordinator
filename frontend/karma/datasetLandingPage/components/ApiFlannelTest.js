import _ from 'lodash';
import { assert } from 'chai';
import ApiFlannel from 'datasetLandingPage/components/ApiFlannel';
import { Simulate } from 'react-dom/test-utils';
import mockView from '../data/mockView';

describe('components/ApiFlannel', () => {
  const getProps = (props) => _.defaultsDeep({}, props, {
    view: mockView,
    onClickCopy: _.noop,
    isTablet: false,
    isMobile: false,
    flannelOpen: true
  });

  const getDropdownToggle = (el) => el.querySelector('.input-group');
  const getDropdownOptions = (el) => el.querySelectorAll('.dropdown-options-list .picklist-option');
  const getResourceText = (el) => el.querySelector('input.endpoint-input').getAttribute('value');
  const getFoundryLinks = (el) => el.querySelectorAll('.documentation-link');

  it('exists if the dataset is tabular', () => {
    const element = renderComponentWithStore(ApiFlannel, getProps());
    assert.ok(element);
  });

  it('does not exist if the dataset is blobby or an href', () => {
    let element = renderComponentWithStore(ApiFlannel, getProps({
      view: {
        isBlobby: true
      }
    }));

    assert.isNull(element);

    element = renderComponentWithStore(ApiFlannel, getProps({
      view: {
        isHref: true
      }
    }));

    assert.isNull(element);
  });

  it('renders a dropdown for the resource type if the view has a named resource url', () => {
    const element = renderComponentWithStore(ApiFlannel, getProps({
      view: {
        namedResourceUrl: 'ohm'
      }
    }));

    assert.ok(getDropdownToggle(element));
    assert.equal(getDropdownOptions(element).length, 3);
  });

  it('renders resource dropdown without geojson if location column doesnt exist', () => {
    const element = renderComponentWithStore(ApiFlannel, getProps());
    assert.equal(getDropdownOptions(element).length, 2);
  });

  it('renders resource dropdown with geojson if location column exists', () => {
    const customProps = {
      view: {
        geoJsonResourceUrl: 'something'
      }
    };
    const element = renderComponentWithStore(ApiFlannel, getProps(customProps));
    assert.equal(getDropdownOptions(element).length, 3);
  });

  it('switches the resource text when clicking the dropdown options', () => {
    const element = renderComponentWithStore(ApiFlannel, getProps({
      view: {
        namedResourceUrl: 'ohm'
      }
    }));

    assert.include(getResourceText(element), 'ohm');

    Simulate.click(getDropdownOptions(element)[0]);

    assert.notInclude(getResourceText(element), 'ohm');
    assert.equal(getResourceText(element), mockView.resourceUrl);
  });

  describe('API foundry link', () => {
    it('is visible if the feature flag is enabled', () => {
      window.serverConfig.featureFlags.enable_dataset_landing_page_foundry_links = true;
      const element = renderComponentWithStore(ApiFlannel, getProps());
      assert.equal(getFoundryLinks(element).length, 2);
    });

    it('is not visible if the feature flag is disabled', () => {
      window.serverConfig.featureFlags.enable_dataset_landing_page_foundry_links = false;
      const element = renderComponentWithStore(ApiFlannel, getProps());
      assert.equal(getFoundryLinks(element).length, 0);
    });
  });
});
