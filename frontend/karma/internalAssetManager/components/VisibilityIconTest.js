import { expect, assert } from 'chai';
import { VisibilityIcon } from 'components/VisibilityIcon';

describe('components/VisibilityIcon', () => {
  const visibilityIconProps = (options = {}) => ({
  isDataLensApproved: undefined,
  isHidden: false,
  isModerationApproved: undefined,
  isPublic: true,
  isPublished: true,
  isRoutingApproved: undefined,
  visibleToAnonymous: true,
    ...options
  });

  it('renders an "open" Flyout container icon', () => {
    const element = renderComponentWithStore(VisibilityIcon, visibilityIconProps());
    assert.isNotNull(element);
    assert.equal(element.className, 'flyout-container');
    assert.isNotNull(element.querySelector('.socrata-icon-geo'));
  });

  it('renders an "internal" Flyout container icon', () => {
    const element = renderComponentWithStore(VisibilityIcon, visibilityIconProps({
      visibleToAnonymous: false
    }));
    assert.isNotNull(element);
    assert.equal(element.className, 'flyout-container');
    assert.isNotNull(element.querySelector('.socrata-icon-private'));
  });
});
