import { assert } from 'chai';
import { ActionDropdown } from 'components/action_dropdown';

describe('components/ActionDropdown', () => {
  const actionDropdownProps = (options = {}) => ({
    assetType: () => 'dataset',
    closeModal: () => undefined,
    deleteAsset: () => undefined,
    uid: 'abcd-1234',
    ...options
  });

  describe('dropdown button', () => {
    it('renders', () => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps());
      assert.isNotNull(element);
      assert.equal(element.className, 'action-dropdown');
      assert.isNotNull(element.querySelector('button.action-dropdown-button'));
    });

    it('adds the "active" class when clicked', () => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps());
      const button = element.querySelector('button.action-dropdown-button');
      TestUtils.Simulate.click(button);
      assert.match(button.className, /active/);
    });
  });

  describe('dropdown menu', () => {
    it('is hidden before the dropdown button is clicked', () => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps());
      assert.isNull(element.querySelector('.action-dropdown-menu'));
    });

    it('renders when the dropdown button is clicked', () => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps());
      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));
      assert.isNotNull(element.querySelector('.action-dropdown-menu'));
    });

    it('renders a link for each action', () => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps());
      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));
      const menu = element.querySelector('.action-dropdown-menu');

      const expectedMenuActions = [
        'editMetadata',
        'changeVisibility',
        'deleteAsset'
      ];

      assert.lengthOf(menu.querySelectorAll('a'), expectedMenuActions.length);
    });

    it('does not render the changeVisibility or editMetdata options for data lens', () => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps({
        assetType: 'datalens'
      }));
      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));
      const menu = element.querySelector('.action-dropdown-menu');

      const expectedMenuActions = [
        'deleteAsset'
      ];

      assert.lengthOf(menu.querySelectorAll('a'), expectedMenuActions.length);
    });

    it('does not render the changeVisibility option for new viz', () => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps({
        assetType: 'visualization'
      }));
      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));
      const menu = element.querySelector('.action-dropdown-menu');

      const expectedMenuActions = [
        'editMetadata',
        'deleteAsset'
      ];

      assert.lengthOf(menu.querySelectorAll('a'), expectedMenuActions.length);
    });

    it('does not render the changeVisibility or editMetadata option for stories', () => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps({
        assetType: 'story'
      }));
      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));
      const menu = element.querySelector('.action-dropdown-menu');

      const expectedMenuActions = [
        'deleteAsset'
      ];

      assert.lengthOf(menu.querySelectorAll('a'), expectedMenuActions.length);
    });
  });

});
