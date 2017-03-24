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
    expect(element).to.exist;
  });

  it('renders a dropdown for the resource type if the view has a named resource url', () => {
    const element = renderComponent(ApiFlannel, getProps({
      view: {
        namedResourceUrl: 'ohm'
      }
    }));

    expect(getDropdownToggle(element)).to.exist;
    expect(getDropdownOptions(element).length).to.equal(2);
  });

  it('does not render a dropdown for the resource type if the view does not have a named resource url', () => {
    const element = renderComponent(ApiFlannel, getProps());
    expect(getDropdownOptions(element).length).to.equal(0);
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
      window.serverConfig.featureFlags.enableDatasetLandingPageFoundryLinks = true;
      const element = renderComponent(ApiFlannel, getProps());
      expect(getFoundryLinks(element)).to.have.length(2);
    });

    it('is not visible if the feature flag is disabled', () => {
      window.serverConfig.featureFlags.enableDatasetLandingPageFoundryLinks = false;
      const element = renderComponent(ApiFlannel, getProps());
      expect(getFoundryLinks(element)).to.have.length(0);
    });
  });
});
