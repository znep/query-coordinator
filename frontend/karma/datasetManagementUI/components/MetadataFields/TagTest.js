import sinon from 'sinon';
import { expect, assert } from 'chai';
import Tag from 'components/MetadataFields/Tag';

describe('components/MetadataFields/Tag', () => {
  let component;

  const defaultProps = {
    tagName: 'testtag',
    onTagClick: () => {}
  };

  beforeEach(() => {
    const shallow = TestUtils.createRenderer();
    shallow.render(<Tag {...defaultProps}/>);
    component = shallow.getRenderOutput();
  });

  it('renders a  list item', () => {
    expect(component.type).to.eq('li');
  });

  it('inserts tagName prop inside list item', () => {
    expect(component.props.children[0]).to.eq(defaultProps.tagName);
  });

  it('inserts a close button inside the list item', () => {
    const closeButton = component.props.children[1];
    expect(closeButton.type.name).to.eq('SocrataIcon');
    expect(closeButton.props.name).to.eq('close-2');
  });

  it('calls the onTagClick callback when tag is clicked', () => {
    const newProps = {
      ...defaultProps,
      onTagClick: sinon.stub()
    };

    const element = renderStatelessComponent(<Tag {...newProps}/>);

    TestUtils.Simulate.click(element.querySelector('.tag'));

    expect(newProps.onTagClick.called).to.eq(true);
  });
})
