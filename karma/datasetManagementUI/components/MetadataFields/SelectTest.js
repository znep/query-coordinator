import Select from 'components/MetadataFields/Select';
import genericFieldDescriptor from 'data/fieldDescriptor';

describe('Select', function() {
  let shallow;

  beforeEach(() => {
    shallow = TestUtils.createRenderer();
  });

  const defaultProps = {
    descriptor: {
      ...genericFieldDescriptor,
      type: 'select',
      options: [
        {title: 'Foo', value: 'foo'},
        {title: 'Bar', value: 'bar'},
      ]
    },
    onChange: _.noop,
    value: 'bar',
    isValid: true
  };

  it('renders an element', function() {
    const element = shallow.render(<Select {...defaultProps}/>);

    expect(element.type).to.eq('select');
  });

  it('renders the provided value', function() {
    const element = renderStatelessComponent(<Select {...defaultProps}/>);

    expect(element.querySelector('select').value).to.eq(defaultProps.value);
  });

  it('invokes the onChange handler', function() {
    const spy = sinon.spy();
    const newProps = {...defaultProps, onChange: spy};
    const element = renderStatelessComponent(<Select {...newProps}/>);

    const input = element.querySelector('select');
    input.value = 'foo';
    TestUtils.Simulate.change(input);

    expect(spy.calledWith('foo')).to.eq(true);
  });

});
