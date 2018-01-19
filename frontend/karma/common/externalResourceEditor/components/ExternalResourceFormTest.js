import sinon from 'sinon';
import { expect, assert } from 'chai';
import { ExternalResourceForm } from 'common/components/ExternalResourceEditor/ExternalResourceForm';
import _ from 'lodash';

describe('ExternalResourceEditor/ExternalResourceForm', () => {
  const defaultProps = {
    description: '',
    onFieldChange: _.noop,
    previewImage: '',
    title: '',
    url: ''
  };

  function getProps(props = {}) {
    return {...defaultProps, ...props};
  }

  it('renders with all input fields', () => {
    const element = renderComponent(ExternalResourceForm, getProps());
    assert.isDefined(element);
    assert.match(element.className, /external-resource-form/);

    assert.isNotNull(element.querySelector('label#external-resource-title-label'));
    assert.isNotNull(element.querySelector('input#external-resource-title'));

    assert.isNotNull(element.querySelector('label#external-resource-description-label'));
    assert.isNotNull(element.querySelector('input#external-resource-description'));

    assert.isNotNull(element.querySelector('label#external-resource-url-label'));
    assert.isNotNull(element.querySelector('input#external-resource-url'));

    assert.isNotNull(element.querySelector('label#external-resource-preview-image-label'));
    assert.isNotNull(element.querySelector('input#external-resource-preview-image'));
  });

  it('triggers onChange when a field is changed', () => {
    const spy = sinon.spy();
    const element = renderComponent(ExternalResourceForm, getProps({ onFieldChange: spy }));

    TestUtils.Simulate.change(element.querySelector('input.title'), { target: { value: 'a' } });
    TestUtils.Simulate.change(element.querySelector('input.description'), { target: { value: 'b' } });
    TestUtils.Simulate.change(element.querySelector('input.url'), { target: { value: 'c' } });

    sinon.assert.calledThrice(spy);
  });
});
