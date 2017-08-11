import { assert } from 'chai';
import InfoPane from 'components/InfoPane';

describe('InfoPane', () => {
  it('renders', () => {
    const element = renderComponentWithStore(InfoPane, {});
    assert.ok(element);
  });
});
