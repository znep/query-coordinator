import { ExternalResourceWizard } from 'components/ExternalResourceWizard';
import $ from 'jquery';

describe('components/ExternalResourceWizard', function() {
  function defaultProps() {
    return {
      title: {
        value: '',
        invalid: true
      },
      description: {
        value: ''
      },
      url: {
        value: '',
        invalid: true
      },
      previewImage: {
        value: ''
      }
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  it('renders', function() {
    var element = renderComponentWithStore(ExternalResourceWizard, getProps());
    expect(element).to.exist;
    expect(element.className).to.match(/external-resource-wizard/);
  });
});
