import { expect, assert } from 'chai';
import { ActionDropdown } from 'components/ActionDropdown';

describe('components/ActionDropdown', () => {
  const actionDropdownProps = (options = {}) => ({
    closeModal: () => undefined,
    deleteAsset: () => undefined,
    uid: 'abcd-1234',
    ...options
  });

  describe('dropdown button', () => {
    it('renders', () => {
      const element = renderComponentWithStore(ActionDropdown, actionDropdownProps());
      assert.isNotNull(element);
      assert.equal(element.className, 'action-dropdown');
      assert.isNotNull(element.querySelector('button.action-dropdown-button'));
    });

    it('adds the "active" class when clicked', () => {
      const element = renderComponentWithStore(ActionDropdown, actionDropdownProps());
      const button = element.querySelector('button.action-dropdown-button');
      TestUtils.Simulate.click(button);
      assert.match(button.className, /active/);
    });
  });

  describe('dropdown menu', () => {
    it('is hidden before the dropdown button is clicked', () => {
      const element = renderComponentWithStore(ActionDropdown, actionDropdownProps());
      assert.isNull(element.querySelector('.action-dropdown-menu'));
    });

    it('renders when the dropdown button is clicked', () => {
      const element = renderComponentWithStore(ActionDropdown, actionDropdownProps());
      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));
      assert.isNotNull(element.querySelector('.action-dropdown-menu'));
    });

    it('renders a list element for each action', () => {
      const menuActions = [
        'addCollaborators',
        'editMetadata',
        'changeVisibility',
        'changePermissions',
        'transferOwnership',
        'deleteAsset'
      ];

      const element = renderComponentWithStore(ActionDropdown, actionDropdownProps());
      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));
      const menu = element.querySelector('.action-dropdown-menu');

      assert.lengthOf(menu.querySelectorAll('li'), menuActions.length);
    });
  });

});
