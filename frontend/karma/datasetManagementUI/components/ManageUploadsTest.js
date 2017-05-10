import { expect, assert } from 'chai';
import ManageUploads from 'components/ManageUploads';

describe('components/ManageUploads', () => {

  it('renders without errors', () => {
    const element = renderComponentWithStore(ManageUploads, {});
    assert.ok(element);
  });

});
