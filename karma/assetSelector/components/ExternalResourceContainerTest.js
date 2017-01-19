import { ExternalResourceContainer } from 'components/ExternalResourceContainer';
import $ from 'jquery';

describe('components/ExternalResourceContainer', function() {
  function defaultProps() {
    return {
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  it('renders', function() {
    var element = renderComponentWithStore(ExternalResourceContainer, getProps());
    expect(element).to.exist;
    expect(element.className).to.eq('external-resource-container');
  });

});
