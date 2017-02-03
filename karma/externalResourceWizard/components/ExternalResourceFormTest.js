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

  it('renders with all input fields', function() {
    var element = renderComponent(ExternalResourceForm, getProps());
    expect(element).to.exist;
    expect(element.className).to.match(/external-resource-form/);

    expect(element.querySelector('label#external-resource-title-label')).to.exist;
    expect(element.querySelector('input#external-resource-title')).to.exist;

    expect(element.querySelector('label#external-resource-description-label')).to.exist;
    expect(element.querySelector('input#external-resource-description')).to.exist;

    expect(element.querySelector('label#external-resource-url-label')).to.exist;
    expect(element.querySelector('input#external-resource-url')).to.exist;

    expect(element.querySelector('label#external-resource-preview-image-label')).to.exist;
    expect(element.querySelector('input#external-resource-preview-image')).to.exist;
  });

  it('triggers onChange when a field is changed', function() {
    var spy = sinon.spy();
    var element = renderComponent(ExternalResourceForm, getProps({ onFieldChange: spy }));

    TestUtils.Simulate.change(element.querySelector('input.title'), { target: { value: 'a' } });
    TestUtils.Simulate.change(element.querySelector('input.description'), { target: { value: 'b' } });
    TestUtils.Simulate.change(element.querySelector('input.url'), { target: { value: 'c' } });

    expect(spy).to.have.been.called.thrice;
  });
});
