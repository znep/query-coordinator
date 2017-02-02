import { ExternalResourceForm } from 'components/ExternalResourceForm';
import _ from 'lodash';

describe('components/ExternalResourceForm', function() {
  function defaultProps() {
    return {
      description: '',
      onFieldChange: _.noop,
      previewImage: '',
      title: '',
      url: ''
    };
  }

  function getProps(props = {}) {
    return {...defaultProps(), ...props};
  }

  it('renders', function() {
    var element = renderComponent(ExternalResourceForm, getProps());
    expect(element).to.exist;
    expect(element.className).to.match(/external-resource-form/);
  });
});

// TODO: add tests
