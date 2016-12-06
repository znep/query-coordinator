import TextArea from 'components/MetadataFields/TextArea';
import genericFieldDescriptor from 'data/fieldDescriptor';

describe('TextArea', function() {
  const defaultProps = {
    descriptor: {
      ...genericFieldDescriptor,
      type: 'textarea'
    },
    onChange: _.noop,
    value: 'Hello world'
  };

  it('renders an element', function() {
    const element = renderPureComponent(TextArea(defaultProps));

    expect(element).to.exist;
    expect(element.querySelector('textarea')).to.exist;
    expect(element.querySelector('label')).to.exist;
  });

  it('renders the provided value', function() {
    const element = renderPureComponent(TextArea(defaultProps));

    expect(element.querySelector('textarea').value).to.eq(defaultProps.value);
  });

  it('invokes the onChange handler', function() {
    const spy = sinon.spy();
    const element = renderPureComponent(TextArea({
      ...defaultProps,
      onChange: spy
    }));

    const textarea = element.querySelector('textarea');
    textarea.value = 'new value';
    TestUtils.Simulate.change(textarea);

    expect(spy.calledWith('new value')).to.eq(true);
  });

  it('displays error state when there\'s a validation error', function() {
    const element = renderPureComponent(TextArea({
      ...defaultProps,
      descriptor: {
        ...defaultProps.descriptor,
        validator: _.constant(false)
      }
    }));

    expect(element.querySelector('span.metadata-validation-error')).to.exist;
    expect(element.querySelector('span.metadata-validation-error').innerText).to.eq(genericFieldDescriptor.errorMsg);
  });

});
