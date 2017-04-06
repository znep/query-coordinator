import { expect, assert } from 'chai';
import Fieldset from 'components/MetadataFields/Fieldset';


describe('components/MetadataFields/Fieldset', () => {
  const defaultProps = {
    title: 'Big Title',
    subtitle: 'Hey a subtitle!',
  };

  const child = (<span>Child</span>);

  const component = renderStatelessComponent(<Fieldset {...defaultProps} />);

  it('renders a title', () => {
    assert.ok(component.querySelector('.tabTitle'));
  });

  it('renders a subtitle', () => {
    assert.ok(component.querySelector('.tabSubtitle'));
  });

  it('renders any elements it wraps (children)', () => {
    const renderer = TestUtils.createRenderer();
    renderer.render(<Fieldset {...defaultProps}>{child}</Fieldset>);
    const element = renderer.getRenderOutput();
    expect(element.props.children[2]).to.eq(child);
  });
});
