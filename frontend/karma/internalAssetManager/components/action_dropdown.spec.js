import sinon from 'sinon';
import { assert } from 'chai';
import { ActionDropdown } from 'components/action_dropdown';
import { mockResponse } from 'httpHelpers';

describe('components/ActionDropdown', () => {
  const actionDropdownProps = (options = {}) => ({
    assetType: 'dataset',
    closeModal: () => undefined,
    deleteAsset: () => undefined,
    uid: 'abcd-1234',
    ...options
  });

  describe('dropdown button', () => {
    beforeEach(() => {
      sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(
        mockResponse({rights: ['view']}, 200)
      )));
    });

    afterEach(() => window.fetch.restore());

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
    beforeEach(() => {
      sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(
        mockResponse({rights: ['view']}, 200)
      )));
    });

    afterEach(() => window.fetch.restore());

    it('shows a spinner before fetching permissions', () => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps());
      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));
      const spinner = element.querySelector('.action-dropdown-content .action-dropdown-spinner-container');
      assert(spinner);
    });
  });

  describe('when no mutation rights are present', () => {
    beforeEach(() => {
      sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(
        mockResponse({rights: ['view']}, 200)
      )));
    });

    afterEach(() => window.fetch.restore());

    it('indicates that no actions are possible', (done) => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps());
      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));
      _.defer(() => {
        const notice = element.querySelector('.action-dropdown-content .no-actions-possible');
        assert(notice);
        done();
      });
    });
  });

  describe('when the delete right is present', () => {
    beforeEach(() => {
      sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(
        mockResponse({rights: ["delete", "delete_view"]}, 200)
      )));
    });

    afterEach(() => window.fetch.restore());

    it('renders a link for the delete action', (done) => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps());
      const expectedMenuActions = [
        'deleteAsset'
      ];

      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));

      _.defer(() => {
        const menu = element.querySelector('.action-dropdown-menu');
        assert.lengthOf(menu.querySelectorAll('a'), expectedMenuActions.length);
        assert.match(menu.querySelector('a').textContent, /delete/i);
        done();
      })
    });
  });

  describe('when the write or update_view rights are present', () => {
    beforeEach(() => {
      sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(
        mockResponse({rights: ["write", "update_view"]}, 200)
      )));
    });

    afterEach(() => window.fetch.restore());

    it('renders links to change visibility and edit metadata', (done) => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps());
      const expectedMenuActions = [
        'changeVisibility',
        'editMetadata'
      ];

      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));

      _.defer(() => {
        const menu = element.querySelector('.action-dropdown-menu');
        const links = menu.querySelectorAll('a');
        assert.lengthOf(links, expectedMenuActions.length);
        assert(_.find(links, (link) => link.textContent.match(/metadata/i)));
        assert(_.find(links, (link) => link.textContent.match(/visibility/i)));
        done();
      })
    });
  });

  describe('when all rights are present', () => {
    beforeEach(() => {
      sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(
        mockResponse({rights: ['delete', 'delete_view', 'write', 'update_view']}, 200)
      )));
    });

    afterEach(() => window.fetch.restore());

    describe('when fetching permissions', () => {
      it('renders a spinner when fetching the permissions', () => {
        const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps());
        TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));
        assert.isNotNull(element.querySelector('.spinner-default'));
      });
    });

    it('is hidden before the dropdown button is clicked', () => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps());
      assert.isNull(element.querySelector('.action-dropdown-menu'));
    });

    it('renders when the dropdown button is clicked', () => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps());
      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));
      assert.isNotNull(element.querySelector('.action-dropdown-content'));
    });

    it('renders a link for each action', (done) => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps());
      const expectedMenuActions = [
        'editMetadata',
        'changeVisibility',
        'deleteAsset'
      ];

      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));

      _.defer(() => {
        const menu = element.querySelector('.action-dropdown-menu');
        assert.lengthOf(menu.querySelectorAll('a'), expectedMenuActions.length);
        done();
      })
    });

    it('does not render the changeVisibility or editMetdata options for data lens', (done) => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps({
        assetType: 'datalens'
      }));
      const expectedMenuActions = [
        'deleteAsset'
      ];

      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));

      _.defer(() => {
        const menu = element.querySelector('.action-dropdown-menu');
        assert.lengthOf(menu.querySelectorAll('a'), expectedMenuActions.length);
        done();
      });
    });

    it('does not render the changeVisibility option for new viz', (done) => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps({
        assetType: 'visualization'
      }));
      const expectedMenuActions = [
        'editMetadata',
        'deleteAsset'
      ];

      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));

      _.defer(() => {
        const menu = element.querySelector('.action-dropdown-menu');
        assert.lengthOf(menu.querySelectorAll('a'), expectedMenuActions.length);
        done();
      });
    });

    it('does not render the changeVisibility or editMetadata option for stories', (done) => {
      const element = renderComponentWithPropsAndStore(ActionDropdown, actionDropdownProps({
        assetType: 'story'
      }));
      const expectedMenuActions = [
        'deleteAsset'
      ];

      TestUtils.Simulate.click(element.querySelector('button.action-dropdown-button'));

      _.defer(() => {
        const menu = element.querySelector('.action-dropdown-menu');
        assert.lengthOf(menu.querySelectorAll('a'), expectedMenuActions.length);
        done();
      });
    });
  });
});
