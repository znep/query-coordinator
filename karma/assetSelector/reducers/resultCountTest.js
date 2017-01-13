import reducer from 'reducers/resultCount';
import { updateResultCount } from 'actions/resultCount';

describe('reducers/resultCount', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('UPDATE_RESULT_COUNT', function() {
    it('updates the result count to the new count', function() {
      expect(state.count).to.eq(0);
      state = reducer(state, updateResultCount(56789));
      expect(state.count).to.eq(56789);
    });
  });
});
