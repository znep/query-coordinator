import reducer from 'reducers/viewType';
import { changeViewType } from 'actions/viewType';

describe('reducers/viewType', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('CHANGE_VIEW_TYPE', function() {
    it('changes type to the new type name', function() {
      expect(state.type).to.equal('CARD_VIEW');
      state = reducer(state, changeViewType('TABLE_VIEW'));
      expect(state.type).to.equal('TABLE_VIEW');
    });
  });
});
