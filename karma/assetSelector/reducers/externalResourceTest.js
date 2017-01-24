import reducer from 'reducers/externalResource';
import { updateField } from 'actions/externalResource';

describe('reducers/externalResource', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('UPDATE_FIELD', function() {
    it('sets the specified field to equal the specified value', function() {
      state = reducer(state, updateField('title', 'Bob Ross'));
      expect(state).to.deep.equal({
        title: 'Bob Ross',
        description: '',
        url: '',
        previewImage: ''
      });

      state = reducer(state, updateField('url', 'http://bobross.com'));
      expect(state).to.deep.equal({
        title: 'Bob Ross',
        description: '',
        url: 'http://bobross.com',
        previewImage: ''
      });

      var bobRossBio = `Known for his fast and easy "wet-on-wet" painting technique, Bob Ross reached
      millions of art lovers with his popular television program The Joy of Painting. ... He then became an
      instructor himself, eventually teaching a TV audience of millions on the PBS show The Joy of Painting.`

      state = reducer(state, updateField('description', bobRossBio));
      expect(state).to.deep.equal({
        title: 'Bob Ross',
        description: bobRossBio,
        url: 'http://bobross.com',
        previewImage: ''
      });

      state = reducer(state, updateField('description', 'New description.'));
      expect(state).to.deep.equal({
        title: 'Bob Ross',
        description: 'New description.',
        url: 'http://bobross.com',
        previewImage: ''
      });
    });
  });
});
