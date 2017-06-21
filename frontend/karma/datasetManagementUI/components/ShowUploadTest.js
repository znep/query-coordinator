import { assert } from 'chai';
import thunk from 'redux-thunk';
import ShowUpload from 'components/ShowUpload';
import configureStore from 'redux-mock-store';
import stateWithRevision from '../data/stateWithRevision';

describe('components/ShowUpload', () => {
  const mockStore = configureStore([thunk]);

  it('renders without errors', () => {
    const element = renderComponentWithStore(
      ShowUpload,
      { params: { uploadId: 123 } },
      mockStore(stateWithRevision)
    );
    assert.ok(element);
  });
});
