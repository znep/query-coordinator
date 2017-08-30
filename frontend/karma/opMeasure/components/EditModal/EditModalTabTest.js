import { assert } from 'chai';
import sinon from 'sinon';
import { Simulate } from 'react-addons-test-utils';

import { EditModalTab } from 'components/EditModal/EditModalTab';

describe('EditModalTab', () => {
  const getProps = (props) => {
    return {
      icon: 'example',
      id: 'foo',
      isSelected: true,
      title: 'Foo',
      onTabNavigation: _.noop,
      ...props
    };
  };

  it('renders a tab with suitable ARIA attributes and an icon', () => {
    const element = renderComponent(EditModalTab, getProps());
    assert.ok(element);
    assert.include(Array.from(element.classList), 'current');

    assert.ok(element.querySelector('.icon-example'));

    const link = element.querySelector('a');
    assert.equal(link.getAttribute('aria-label'), 'Foo');
    assert.equal(link.getAttribute('aria-selected'), 'true');
    assert.equal(link.getAttribute('aria-controls'), 'foo-panel');
    assert.equal(link.getAttribute('role'), 'tab');
  });

  it('calls onTabNavigation when the tab link is clicked', () => {
    const spy = sinon.spy();
    const element = renderComponent(EditModalTab, getProps({
      onTabNavigation: spy
    }));

    sinon.assert.notCalled(spy);
    Simulate.click(element.querySelector('a'));
    sinon.assert.calledOnce(spy);
  });
});
