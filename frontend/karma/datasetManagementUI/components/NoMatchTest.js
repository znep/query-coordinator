import { expect, assert } from 'chai';
import NoMatch from 'components/NoMatch';

describe('components/NoMatch', () => {

  it('renders without errors', () => {
    const element = renderComponentWithStore(NoMatch, {});
    assert.ok(element);
  });

});
