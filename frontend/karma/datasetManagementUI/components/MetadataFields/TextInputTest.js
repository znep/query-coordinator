import TextInput from 'components/MetadataFields/TextInput';
import genericFieldDescriptor from 'data/fieldDescriptor';

describe('TextInput', function() {
  const defaultProps = {
    descriptor: {
      ...genericFieldDescriptor,
      type: 'text'
    },
    onChange: _.noop,
    value: 'Hello world',
    isValid: true
  };

  it('renders an element', function() {
    const element = renderStatelessComponent(<TextInput {...defaultProps} />);

    expect(element).to.exist;
    expect(element.querySelector('input')).to.exist;
  });

  it('renders the provided value', function() {
    const element = renderStatelessComponent(<TextInput {...defaultProps} />);

    expect(element.querySelector('input').value).to.eq(defaultProps.value);
  });

  it('invokes the onChange handler', function() {
    const spy = sinon.spy();
    const newProps = {...defaultProps, onChange: spy};
    const element = renderStatelessComponent(<TextInput {...newProps} />);

    const input = element.querySelector('input');
    input.value = 'new value';
    TestUtils.Simulate.change(input);

    expect(spy.calledWith('new value')).to.eq(true);
  });
});
