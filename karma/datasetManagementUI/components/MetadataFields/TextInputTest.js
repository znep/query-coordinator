import TextInput from 'components/MetadataFields/TextInput';
import genericFieldDescriptor from 'data/fieldDescriptor';

describe('TextInput', function() {
  const defaultProps = {
    descriptor: {
      ...genericFieldDescriptor,
      type: 'text'
    },
    onChange: _.noop,
    value: 'Hello world'
  };

  it('renders an element', function() {
    const element = renderPureComponent(TextInput(defaultProps));

    expect(element).to.exist;
    expect(element.querySelector('input')).to.exist;
    expect(element.querySelector('label')).to.exist;
  });

  it('renders the provided value', function() {
    const element = renderPureComponent(TextInput(defaultProps));

    expect(element.querySelector('input').value).to.eq(defaultProps.value);
  });

  it('invokes the onChange handler', function() {
    const spy = sinon.spy();
    const element = renderPureComponent(TextInput({
      ...defaultProps,
      onChange: spy
    }));

    const input = element.querySelector('input');
    input.value = 'new value';
    TestUtils.Simulate.change(input);

    expect(spy.calledWith('new value')).to.eq(true);
  });

  it('displays error state when there\'s a validation error', function() {
    const element = renderPureComponent(TextInput({
      ...defaultProps,
      descriptor: {
        ...defaultProps.descriptor,
        validator: _.constant(false)
      }
    }));

    expect(element.querySelector('input.text-input-error')).to.exist;
    expect(element.querySelector('span.metadata-validation-error')).to.exist;
    expect(element.querySelector('span.metadata-validation-error').innerText).to.eq(genericFieldDescriptor.errorMsg);
  });

});
