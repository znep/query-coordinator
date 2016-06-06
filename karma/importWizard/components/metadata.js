import {
  update,
  emptyForName,
  updateName,
  updateDescription,
  updateCategory,
  updateTags,
  updateRowLabel,
  updateMapLayer,
  updatePrivacySettings,
  updateContactEmail
} from 'components/metadata';

describe("metadata's reducer", function() {
  var state;

  beforeEach(function() {
    state = emptyForName('test dataset');
  });

  describe('SET_NAME', function() {
    it('sets the name of the dataset', function() {
      state.name = 'pandas';

      var result = update(state, updateName('wombats'));
      expect(result.name).to.equal('wombats');
    });
  });

  describe('SET_DESCRIPTION', function() {
    it('sets the description of the dataset', function() {
      state.description = 'pandas';

      var result = update(state, updateDescription('wombats'));
      expect(result.description).to.equal('wombats');
    });
  });

  describe('SET_CATEGORY', function() {
    it('sets the category of the dataset', function() {
      state.category = 'Business';

      var result = update(state, updateCategory('Personal'));
      expect(result.category).to.equal('Personal');
    });
  });

  describe('SET_TAGS', function() {
    it('sets the tags of the dataset', function() {
      state.tags = 'pandas';

      var result = update(state, updateTags('wombats'));
      expect(result.tags).to.equal('wombats');
    });
  });

  describe('SET_ROWLABEL', function() {
    it('sets the row label of the dataset', function() {
      state.rowLabel = 'pandas';

      var result = update(state, updateRowLabel('wombats'));
      expect(result.rowLabel).to.equal('wombats');
    });
  });

  describe('SET_MAPLAYER', function() {
    it('sets the map layer url of the dataset', function() {
      state.mapLayer = 'pandas.ch';

      var result = update(state, updateMapLayer('wombats.au'));
      expect(result.mapLayer).to.equal('wombats.au');
    });
  });

  describe('CHECK_PRIVACY_INITIALIZATION_PRIVATE', function() {
    it('checks initial privacy of the dataset', function() {
      expect(state.privacySettings).to.equal('private');
    });
  });

  describe('SET_PRIVACY_PUBLIC', function() {
    it('sets the privacy of the dataset to public', function() {
      state.description = 'private';

      var result = update(state, updatePrivacySettings('public'));
      expect(result.privacySettings).to.equal('public');
    });
  });

  describe('SET_PRIVACY_PRIVATE', function() {
    it('sets the privacy of the dataset to private', function() {
      state.description = 'public';

      var result = update(state, updatePrivacySettings('private'));
      expect(result.privacySettings).to.equal('private');
    });
  });

  describe('SET_CONTACTEMAIL', function() {
    it('sets the contact email of the dataset', function() {
      state.contactEmail = 'pandas@china.ch';

      var result = update(state, updateContactEmail('wombats@australia.au'));
      expect(result.contactEmail).to.equal('wombats@australia.au');
    });
  });
});
