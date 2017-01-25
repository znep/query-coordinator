import reducer from 'reducers/externalResource';
import { updateTitle, updateDescription, updateUrl, updatePreviewImage } from 'actions/externalResource';

describe('reducers/externalResource', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('UPDATE_TITLE', function() {
    it('sets the title to the specified value', function() {
      state = reducer(state, updateTitle('Bob Ross'));
      expect(state.title).to.deep.equal({
        value: 'Bob Ross',
        invalid: false
      });
    });

    it('is invalid with an empty title', function() {
      state = reducer(state, updateTitle(''));
      expect(state.title).to.deep.equal({
        value: '',
        invalid: true
      });
    });
  });

  describe('UPDATE_DESCRIPTION', function() {
    it('sets the description to the specified value', function() {
      state = reducer(state, updateDescription('Painter'));
      expect(state.description).to.deep.equal({
        value: 'Painter'
      });
    });

    it('is not invalid with an empty description', function() {
      state = reducer(state, updateDescription(''));
      expect(state.description).to.deep.equal({
        value: ''
      });
    });
  });

  describe('UPDATE_URL', function() {
    it('sets the url to the specified value', function() {
      state = reducer(state, updateUrl('https://google.com'));
      expect(state.url).to.deep.equal({
        value: 'https://google.com',
        invalid: false
      });
    });

    it('is invalid with an empty url', function() {
      state = reducer(state, updateUrl(''));
      expect(state.url).to.deep.equal({
        value: '',
        invalid: true
      });
    });

    it('is invalid without the http scheme', function() {
      state = reducer(state, updateUrl('www.google.com'));
      expect(state.url).to.deep.equal({
        value: 'www.google.com',
        invalid: true
      });
    });
  });

  describe('UPDATE_PREVIEW_IMAGE', function() {
    it('sets the previewImage to the specified value', function() {
      state = reducer(state, updatePreviewImage('data:image/jpeg;base64,/9j/4VGcRXhpZgAASUkqAAgAAAAMAA8BA'));
      expect(state.previewImage).to.deep.equal({
        value: 'data:image/jpeg;base64,/9j/4VGcRXhpZgAASUkqAAgAAAAMAA8BA'
      });
    });

    it('is not invalid with an empty value', function() {
      state = reducer(state, updatePreviewImage(''));
      expect(state.previewImage).to.deep.equal({
        value: ''
      });
    });
  });
});
