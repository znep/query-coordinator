import { expect, assert } from 'chai';
import { ApiFlannel } from 'components/ApiFlannel';
import { Simulate } from 'react-addons-test-utils';
import mockView from 'data/mockView';

describe('components/ApiFlannel', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      view: mockView,
      onClickCopy: _.noop
    });
  }

  const getDropdownToggle = (el) => el.querySelector('.input-group-btn');
  const getDropdownOptions = (el) => el.querySelectorAll('.input-group-btn .dropdown-options .option');
  const getResourceText = (el) => el.querySelector('input.endpoint-input').getAttribute('value');
  const getFoundryLinks = (el) => el.querySelectorAll('.documentation-link');

  it('renders an element', () => {
    const element = renderComponent(ApiFlannel, getProps());
    assert.ok(element);
  });

  it('renders a dropdown for the resource type if the view has a named resource url', () => {
    const element = renderComponent(ApiFlannel, getProps({
      view: {
        namedResourceUrl: 'ohm'
      }
    }));

    assert.ok(getDropdownToggle(element));
    expect(getDropdownOptions(element).length).to.equal(3);
  });

  it('renders resource dropdown without geojson if location column doesnt exist', () => {
    const element = renderComponent(ApiFlannel, getProps());
    expect(getDropdownOptions(element).length).to.equal(2);
  });

  it('renders resource dropdown with geojson if location column exists', () => {
    const customProps = {
      view: {
        geoJsonResourceUrl: 'something'
      }
    };
    const element = renderComponent(ApiFlannel, getProps(customProps));
    expect(getDropdownOptions(element).length).to.equal(3);
  });

  it('switches the resource text when clicking the dropdown options', () => {
    const element = renderComponent(ApiFlannel, getProps({
      view: {
        namedResourceUrl: 'ohm'
      }
    }));

    expect(getResourceText(element)).to.contain('ohm');

    Simulate.mouseUp(getDropdownToggle(element).querySelector('.dropdown'));
    Simulate.mouseUp(getDropdownOptions(element)[0]);

    expect(getResourceText(element)).to.not.contain('ohm');
    expect(getResourceText(element)).to.equal(mockView.resourceUrl);
  });

  describe('API foundry link', () => {
    it('is visible if the feature flag is enabled', () => {
      window.serverConfig.featureFlags.enable_dataset_landing_page_foundry_links = true;
      const element = renderComponent(ApiFlannel, getProps());
      expect(getFoundryLinks(element)).to.have.length(2);
    });

    it('is not visible if the feature flag is disabled', () => {
      window.serverConfig.featureFlags.enable_dataset_landing_page_foundry_links = false;
      const element = renderComponent(ApiFlannel, getProps());
      expect(getFoundryLinks(element)).to.have.length(0);
    });
  });
});
