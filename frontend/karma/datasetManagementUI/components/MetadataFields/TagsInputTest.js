import TagsInput from 'components/MetadataFields/TagsInput';

describe('components/MetadataFields/TagsInput', () => {
  let component;
  let shallow;

  const defaultProps = {
    onChange: sinon.stub(),
    placeholder: 'type tags here',
    tags: ['one', 'two', 'three']
  };

  beforeEach(() => {
    shallow = TestUtils.createRenderer();
    shallow.render(<TagsInput {...defaultProps}/>);
    component = shallow.getRenderOutput();
  });

  const getComponentType = elem => {
    if (typeof elem === 'string') {
      return 'text-node';
    } else if (elem.type) {
      return typeof elem.type === 'function' ? elem.type.name : elem.type;
    } else {
      return 'unknown type';
    }
  };

  const crawlRenderTree = (elem, types = []) => {
    if (Array.isArray(elem)) {
      for (let i = 0; i < elem.length; i += 1) {
        if (elem[i].props && elem[i].props.children) {
          crawlRenderTree(elem[i], types)
        } else {
          types.push(getComponentType(elem[i]))
        }
      }
    } else {
      types.push(getComponentType(elem))
      if (elem.props && elem.props.children) {
        crawlRenderTree(elem.props.children, types)
      }
    }
    return types;
  };

  it('renders an input field', () => {
    const children = crawlRenderTree(component);
    expect(children).to.contain('input');
  });

  it('renders a Tag component for each item in tags prop', () => {
    const tagComponents = crawlRenderTree(component).filter(child => child === 'Tag');
    expect(tagComponents.length).to.eq(defaultProps.tags.length);
  });

  it('calls its onChange callback when addTag/RemoveTag methods are invoked', () => {
    const newProps = {
      ...defaultProps,
      onChange: sinon.spy()
    };
    const elem = TestUtils.renderIntoDocument(<TagsInput {...newProps}/>);
    elem.setState({tagName: 'hey'});
    elem.addTag({preventDefault: () => {}});
    elem.removeTag('hey');
    expect(newProps.onChange.calledTwice).to.eq(true);
  });
})
