import { assert } from 'chai';
import { VisibilityCell } from 'components/VisibilityCell';

describe('components/VisibilityCell', () => {
  const visibilityCellProps = (options = {}) => ({
  isDataLensApproved: undefined,
  isHidden: false,
  isModerationApproved: undefined,
  isPublic: true,
  isPublished: true,
  isRoutingApproved: undefined,
  visibleToAnonymous: true,
    ...options
  });

  describe('Open visibility', () => {
    it('renders the "open" icon', () => {
      const element = renderComponentWithStore(VisibilityCell, visibilityCellProps());
      assert.isNotNull(element);
      assert.equal(element.className, 'visibility-cell');
      assert.isNotNull(element.querySelector('.title span.socrata-icon-public-open'));
    });
  });

  describe('Internal visibility', () => {
    it('renders the "internal" icon', () => {
      const element = renderComponentWithStore(VisibilityCell, visibilityCellProps({
        visibleToAnonymous: false
      }));
      assert.isNotNull(element);
      assert.equal(element.className, 'visibility-cell');
      assert.isNotNull(element.querySelector('.title span.socrata-icon-private'));
    });
  });

});
