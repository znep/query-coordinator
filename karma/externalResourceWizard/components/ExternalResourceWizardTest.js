import { ExternalResourceWizard } from 'components/ExternalResourceWizard';
import $ from 'jquery';

describe('components/ExternalResourceWizard', function() {
  function defaultProps() {
    return {
      modalIsOpen: false,
      onClose: _.noop,
      onSelect: _.noop
    };
  }

  function getProps(props = {}) {
    return {...defaultProps(), ...props};
  }

  it('renders', function() {
    var element = renderComponent(ExternalResourceWizard, getProps());
    expect(element).to.exist;
    expect(element.className).to.match(/external-resource-wizard/);
  });
});

// TODO: add tests
