import { assert } from 'chai';
import renderComponent from '../../renderComponent';
import TestUtils from 'react-dom/test-utils';
import TextInputButton from 'common/authoring_workflow/components/shared/TextInputButton';
import { getInputDebounceMs } from 'common/authoring_workflow/constants';

describe('TextInputButton', () => {

  it('should render given placeholder, textInputId and value attributes', () => {
    const onChangeCallback = sinon.spy();
    const component = renderComponent(TextInputButton, {
      onChange: onChangeCallback,
      placeholder: 'Placeholder',
      textInputId: 'Id',
      textInputValue: 'Value'
    });

    const textInput = component.querySelector('.text-input');
    assert.equal(textInput.value, 'Value');
    assert.equal(textInput.placeholder, 'Placeholder');
    assert.equal(textInput.getAttribute('id'), 'Id');
  });

  it('should call change callback when user changes the value', (done) => {
    const onChangeCallback = sinon.spy();
    const component = renderComponent(TextInputButton, {
      onChange: onChangeCallback,
      placeholder: 'Placeholder',
      textInputId: 'Id',
      textInputValue: 'Value'
    });

    TestUtils.Simulate.change(component.querySelector('#Id'));

    setTimeout(() => {
      sinon.assert.calledOnce(onChangeCallback);
      done();
    }, getInputDebounceMs());
  });
});

