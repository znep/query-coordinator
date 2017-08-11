import { assert } from 'chai';
import { App } from 'App';

describe('App', () => {
  it('renders', () => {
    const element = renderComponentWithStore(App);
    assert.ok(element);
  });
});
