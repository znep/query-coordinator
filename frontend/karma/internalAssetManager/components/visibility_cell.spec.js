import { assert } from 'chai';
import { VisibilityCell } from 'components/visibility_cell';

describe('components/VisibilityCell', () => {
  const visibilityCellProps = (options = {}) => ({
    datalensStatus: null,
    grants: [],
    isDatalensApproved: undefined,
    isExplicitlyHidden: false,
    isModerationApproved: undefined,
    isPublic: true,
    isPublished: true,
    isRoutingApproved: undefined,
    moderationStatus: null,
    routingStatus: null,
    visibleToAnonymous: true,
    ...options
  });

  describe('Open visibility', () => {
    it('renders the "open" title and icon', () => {
      const element = renderComponentWithPropsAndStore(VisibilityCell, visibilityCellProps());
      assert.isNotNull(element);
      assert.equal(element.className, 'visibility-cell');
      assert.equal(element.textContent, 'Open');
      assert.isNotNull(element.querySelector('.title span.socrata-icon-public-open'));
    });
  });

  describe('Private visibility', () => {
    it('renders the "private" title and icon', () => {
      const element = renderComponentWithPropsAndStore(VisibilityCell, visibilityCellProps({
        visibleToAnonymous: false,
        isPublic: false
      }));
      assert.isNotNull(element);
      assert.equal(element.className, 'visibility-cell');
      assert.equal(element.textContent, 'Private');
      assert.isNotNull(element.querySelector('.title span.socrata-icon-private'));
    });

    it('shows the "shared to me" description if the current user is listed in the grants array', () => {
      const fakeUserId = 'abcd-1234';
      window.serverConfig.currentUser = { id: fakeUserId };

      const element = renderComponentWithPropsAndStore(VisibilityCell, visibilityCellProps({
        visibleToAnonymous: false,
        isPublic: false,
        grants: [{
          user_id: fakeUserId,
          type: 'viewer'
        }]
      }));
      assert.equal(element.querySelector('.visibility-description').textContent, 'Shared to me');
    });

    it('does not show the "shared to me" description if the current user is not listed in the grants array', () => {
      window.serverConfig.currentUser = { id: 'abcd-1234' };

      const element = renderComponentWithPropsAndStore(VisibilityCell, visibilityCellProps({
        visibleToAnonymous: false,
        isPublic: false,
        grants: [{
          user_id: 'wxyz-9876',
          type: 'viewer'
        }]
      }));
      assert.equal(element.querySelector('.visibility-description').textContent, '');
    });

    it('takes priority over Hidden visibility', () => {
      const element = renderComponentWithPropsAndStore(VisibilityCell, visibilityCellProps({
        visibleToAnonymous: false,
        isPublic: false,
        isPublished: false,
        isModerationApproved: false
      }));
      assert.equal(element.textContent, 'Private');
      assert.isNotNull(element.querySelector('.title span.socrata-icon-private'));
    });
  });

  describe('Hidden visibility', () => {
    it('renders the "hidden" title and icon', () => {
      const element = renderComponentWithPropsAndStore(VisibilityCell, visibilityCellProps({
        visibleToAnonymous: false,
        isPublished: false
      }));
      assert.isNotNull(element);
      assert.equal(element.className, 'visibility-cell');
      assert.equal(element.textContent, 'Pending');
      assert.isNotNull(element.querySelector('.title span.socrata-icon-eye-blocked'));
    });

    it('shows the "rejected" description if the asset has rejected view moderation', () => {
      const element = renderComponentWithPropsAndStore(VisibilityCell, visibilityCellProps({
        visibleToAnonymous: false,
        isModerationApproved: false,
        moderationStatus: 'rejected'
      }));
      assert.equal(element.querySelector('.visibility-description').textContent, 'Rejected');
    });

    it('shows the "rejected" description if the asset has rejected routing and approval', () => {
      const element = renderComponentWithPropsAndStore(VisibilityCell, visibilityCellProps({
        visibleToAnonymous: false,
        isRoutingApproved: false,
        routingStatus: 'rejected'
      }));
      assert.equal(element.querySelector('.visibility-description').textContent, 'Rejected');
    });

    it('shows the "rejected" description if the asset has rejected data lens', () => {
      const element = renderComponentWithPropsAndStore(VisibilityCell, visibilityCellProps({
        visibleToAnonymous: false,
        isDatalensApproved: false,
        datalensStatus: 'rejected'
      }));
      assert.equal(element.querySelector('.visibility-description').textContent, 'Rejected');
    });

    it('shows the "pending" description if the asset has pending view moderation', () => {
      const element = renderComponentWithPropsAndStore(VisibilityCell, visibilityCellProps({
        visibleToAnonymous: false,
        isModerationApproved: false,
        moderationStatus: 'pending'
      }));
      assert.equal(element.querySelector('.visibility-description').textContent, 'Awaiting approval');
    });

    it('shows the "pending" description if the asset has pending routing and approval', () => {
      const element = renderComponentWithPropsAndStore(VisibilityCell, visibilityCellProps({
        visibleToAnonymous: false,
        isRoutingApproved: false,
        routingStatus: 'pending'
      }));
      assert.equal(element.querySelector('.visibility-description').textContent, 'Awaiting approval');
    });

    it('shows the "pending" description if the asset has pending data lens', () => {
      const element = renderComponentWithPropsAndStore(VisibilityCell, visibilityCellProps({
        visibleToAnonymous: false,
        isDatalensApproved: false,
        datalensStatus: 'pending'
      }));
      assert.equal(element.querySelector('.visibility-description').textContent, 'Awaiting approval');
    });

    it('shows "rejected" over "pending" if both apply to a given asset', () => {
      const element = renderComponentWithPropsAndStore(VisibilityCell, visibilityCellProps({
        visibleToAnonymous: false,
        isDatalensApproved: false,
        datalensStatus: 'rejected',
        isRoutingApproved: false,
        routingStatus: 'pending'
      }));
      assert.equal(element.querySelector('.visibility-description').textContent, 'Rejected');
    });
  });

});
