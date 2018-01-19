import { assert } from 'chai';

import testStore from '../../testStore';
import EventFilter from 'adminActivityFeedSoql/components/FilterPanel/EventFilter';
import { EVENT_TYPES } from 'adminActivityFeedSoql/constants';

describe('EventFilter', () => {
  const store = testStore({
    filters: {
      assetTypes: null
    }
  });

  const element = renderComponentWithLocalization(EventFilter, {}, store);

  it('renders', () => {
    assert.isNotNull(element);
    assert.isOk(element.classList.contains('event-filter'));
  });

  it('renders all options', () => {
    assert.equal(
      element.querySelectorAll('.picklist-option').length,
      EVENT_TYPES.length + 1
    );
  });
});
