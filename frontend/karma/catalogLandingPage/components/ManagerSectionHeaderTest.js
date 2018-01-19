import { assert } from 'chai';
import { ManagerSectionHeader } from 'catalogLandingPage/components/ManagerSectionHeader';

describe('components/ManagerSectionHeader', () => {
  it('renders a ManagerSectionHeader', () => {
    const element = renderComponent(ManagerSectionHeader, { children: 'Hi', className: 'testaroo' });
    assert.isNotNull(element);
    assert.equal(element.tagName, 'H6');
    assert.equal(element.className, 'h6 styleguide-subheader testaroo');
    assert.equal(element.textContent, 'Hi');
  });
});
