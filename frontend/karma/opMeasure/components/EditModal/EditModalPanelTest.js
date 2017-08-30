import { assert } from 'chai';

import { EditModalPanel } from 'components/EditModal/EditModalPanel';

describe('EditModalPanel', () => {
  const getProps = (props) => {
    return {
      id: 'foo',
      isSelected: false,
      children: (
        <span id="test-child" />
      ),
      ...props
    };
  };

  it('renders a tab with suitable ARIA attributes', () => {
    const element = renderComponent(EditModalPanel, getProps());
    assert.ok(element);
    assert.include(Array.from(element.classList), 'hidden');
    assert.equal(element.getAttribute('aria-hidden'), 'true');
    assert.equal(element.getAttribute('aria-labelledby'), 'foo-link');
    assert.equal(element.getAttribute('role'), 'tabpanel');

    assert.ok(element.querySelector('#test-child'));
  });
});
