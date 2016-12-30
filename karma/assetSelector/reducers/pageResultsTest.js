import reducer from 'reducers/pageResults';
import { updatePageResults } from 'actions/pageResults';
import _ from 'lodash';

describe('reducers/pageResults', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('UPDATE_RESULTS', function() {
    it('updates the results to the new results', function() {
      expect(_.isEqual(state.results, [])).to.be.true;
      var testResults = [{ name: 'test card 1' }, { name: 'test card 2' }];
      state = reducer(state, updatePageResults(testResults));
      expect(_.isEqual(state.results, testResults)).to.be.true;
    });
  });
});
