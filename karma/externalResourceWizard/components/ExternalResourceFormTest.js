import { ExternalResourceForm } from 'components/ExternalResourceForm';
import $ from 'jquery';

describe('components/ExternalResourceForm', function() {
  function defaultProps() {
    return {
      dispatchUpdateTitle: _.noop,
      dispatchUpdateDescription: _.noop,
      dispatchUpdateUrl: _.noop,
      dispatchUpdatePreviewImage: _.noop,
      title: { value: '', invalid: true },
      description: { value: '' },
      url: { value: '', invalid: true },
      previewImage: { value: '' }
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
