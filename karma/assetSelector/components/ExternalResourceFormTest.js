import { ExternalResourceForm } from 'components/ExternalResourceForm';
import $ from 'jquery';

describe('components/ExternalResourceForm', function() {
  function defaultProps() {
    return {
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  it('renders', function() {
    var element = renderComponentWithStore(ExternalResourceForm, getProps());
    expect(element).to.exist;
    expect(element.className).to.match(/external-resource-form/);
  });
});
