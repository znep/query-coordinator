import sinon from 'sinon';
import { expect, assert } from 'chai';
import { EditBar } from 'components/EditBar';

describe('EditBar', () => {
  const getProps = (props) => {
    return {
      name: 'wombats',
      menuLabel: 'menu',
      onClickPreview: _.noop,
      onClickMenu: _.noop,
      onClickName: _.noop,
      ...props
    };
  };

  let element;

  beforeEach(() => {
    element = renderComponentWithStore(EditBar, getProps());
  });

  it('renders', () => {
    assert.ok(element);
  });

  it('renders the page name', () => {
    expect(element.innerText).to.contain('wombats');
  });

  it('renders a save button', () => {
    assert.ok(element.querySelector('.btn-save'));
  });

  it('renders a preview button', () => {
    assert.ok(element.querySelector('.btn-preview'));
  });

  it('invokes onClickPreview on preview click', () => {
    const onClickSpy = sinon.spy();
    const element = renderComponentWithStore(EditBar, getProps({
      onClickPreview: onClickSpy
    }));

    TestUtils.Simulate.click(element.querySelector('.btn-preview'));

    sinon.assert.called(onClickSpy);
  });
});
