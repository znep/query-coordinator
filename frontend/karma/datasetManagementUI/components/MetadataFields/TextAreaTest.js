import TextArea from 'components/MetadataFields/TextArea';
import genericFieldDescriptor from 'data/fieldDescriptor';

describe('TextArea', function() {
  const defaultProps = {
    descriptor: {
      ...genericFieldDescriptor,
      type: 'textarea'
    },
    onChange: _.noop,
    value: 'Hello world',
    isValid: true
  };

  it('renders an element', function() {
    const element = renderStatelessComponent(<TextArea {...defaultProps}/>);
    expect(element).to.exist;
    expect(element.querySelector('textarea')).to.exist;
  });

  it('renders the provided value', function() {
    const element = renderStatelessComponent(<TextArea {...defaultProps}/>);
    expect(element.querySelector('textarea').value).to.eq(defaultProps.value);
  });

  it('invokes the onChange handler', function() {
    const spy = sinon.spy();
    const newProps = {...defaultProps, onChange: spy};

    const element = renderStatelessComponent(<TextArea {...newProps}/>);

    const textarea = element.querySelector('textarea');
    textarea.value = 'new value';
    TestUtils.Simulate.change(textarea);

    expect(spy.calledWith('new value')).to.eq(true);
  });
});
