import Select from 'components/MetadataFields/Select';
import genericFieldDescriptor from 'data/fieldDescriptor';

describe('Select', function() {
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
    value: 'bar'
  };

  it('renders an element', function() {
    const element = renderPureComponent(Select(defaultProps));

    expect(element).to.exist;
    expect(element.querySelector('select')).to.exist;
    expect(element.querySelector('label')).to.exist;
  });

  it('renders the provided value', function() {
    const element = renderPureComponent(Select(defaultProps));

    expect(element.querySelector('select').value).to.eq(defaultProps.value);
  });

  it('invokes the onChange handler', function() {
    const spy = sinon.spy();
    const element = renderPureComponent(Select({
      ...defaultProps,
      onChange: spy
    }));

    const input = element.querySelector('select');
    input.value = 'foo';
    TestUtils.Simulate.change(input);

    expect(spy.calledWith('foo')).to.eq(true);
  });

});
