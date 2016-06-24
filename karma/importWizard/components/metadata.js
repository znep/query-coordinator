import React, { PropTypes } from 'react'; // eslint-disable-line keyword-spacing
import _ from 'lodash';
import TestUtils from 'react-addons-test-utils';

import {
  update,
  updateForLastSaved,
  emptyForName,
  updateName,
  updateDescription,
  updateCategory,
  updateTags,
  updateRowLabel,
  updateAttributionLink,
  updatePrivacySettings,
  updateContactEmail,
  updateNextClicked,
  updateLastSaved,
  validate,
  isStandardMetadataValid,
  isCustomMetadataValid,
  isMetadataValid,
  view
} from 'components/metadata';

import { initialNewDatasetModel } from 'wizard';

describe("metadata's reducer testing", () => {
  let state;

  beforeEach(() => {
    state = emptyForName('test dataset');
  });

  describe('SET_NAME', () => {
    it('sets the name of the dataset', () => {
      state.name = 'pandas';

      const result = update(state, updateName('wombats'));
      expect(result.name).to.equal('wombats');
    });
  });

  describe('SET_DESCRIPTION', () => {
    it('sets the description of the dataset', () => {
      state.description = 'pandas';

      const result = update(state, updateDescription('wombats'));
      expect(result.description).to.equal('wombats');
    });
  });

  describe('SET_CATEGORY', () => {
    it('sets the category of the dataset', () => {
      state.category = 'Business';

      const result = update(state, updateCategory('Personal'));
      expect(result.category).to.equal('Personal');
    });
  });

  describe('SET_TAGS', () => {
    it('sets the tags of the dataset', () => {
      state.tags = [];

      const result = update(state, updateTags('wombats,pandas'));
      expect(result.tags[0]).to.equal('wombats');
      expect(result.tags[1]).to.equal('pandas');
    });
  });

  describe('SET_ROWLABEL', () => {
    it('sets the row label of the dataset', () => {
      state.rowLabel = 'pandas';

      const result = update(state, updateRowLabel('wombats'));
      expect(result.rowLabel).to.equal('wombats');
    });
  });

  describe('SET_ATTRIBUTIONLINK', () => {
    it('sets the attribution link url of the dataset', () => {
      state.attributionLink = 'pandas.ch';

      const result = update(state, updateAttributionLink('wombats.au'));
      expect(result.attributionLink).to.equal('wombats.au');
    });
  });

  describe('CHECK_PRIVACY_INITIALIZATION_PRIVATE', () => {
    it('checks initial privacy of the dataset', () => {
      expect(state.privacySettings).to.equal('private');
    });
  });

  describe('SET_PRIVACY_PUBLIC', () => {
    it('sets the privacy of the dataset to public', () => {
      state.privacySettings = 'private';

      const result = update(state, updatePrivacySettings('public'));
      expect(result.privacySettings).to.equal('public');
    });
  });

  describe('SET_PRIVACY_PRIVATE', () => {
    it('sets the privacy of the dataset to private', () => {
      state.privacySettings = 'public';

      const result = update(state, updatePrivacySettings('private'));
      expect(result.privacySettings).to.equal('private');
    });
  });

  describe('SET_EMAIL', () => {
    it('sets the contact email of the dataset', () => {
      state.contactEmail = 'pandas@china.ch';

      const result = update(state, updateContactEmail('wombats@australia.au'));
      expect(result.contactEmail).to.equal('wombats@australia.au');
    });
  });

  describe('SET_NEXTCLICKED', () => {
    it('sets nextClicked to true once the next button is clicked', () => {
      expect(state.nextClicked).to.equal(false);

      const result = update(state, updateNextClicked());
      expect(result.nextClicked).to.equal(true);
    });
  });
});

describe('validators', () => {
  let metadata;

  beforeEach(() => {
    metadata = {
      name: '',
      attributionLink: '',
      customMetadata: {
        'jack':
          [
            {
              field: '1',
              value: 'ant',
              privateField: false
            },
            {
              field: '2',
              value: '',
              privateField: true
            },
            {
              field: '3',
              value: '',
              privateField: false
            }
          ],
        'second':
          [
            {
              field: 'mars',
              value: '',
              privateField: false
            },
            {
              field: 'venus',
              value: '',
              privateField: false
            },
            {
              field: 'neptune',
              value: '50',
              privateField: false
            },
            {
              field: 'jupiter',
              value: '',
              privateField: false
            }
          ]
        }
    };
  });

  describe('validation testing', () => {
    it('returns false for each key in metadata if they are empty', () => {
      const standardValid = isStandardMetadataValid(metadata);
      expect(standardValid).to.equal(false);

      const result = validate(metadata);
      expect(result.name).to.equal(false);
      expect(result.attributionLink).to.equal(false);
    });
  });

  it('returns true if customMetadata has empty keys', () => {
    metadata.name = 'panda',
    metadata.attributionLink = 'wombat'

    const standardValid = isStandardMetadataValid(metadata);
    expect(standardValid).to.equal(true);

    const result = validate(metadata);
    expect(result.name).to.equal(true);
    expect(result.attributionLink).to.equal(true);
  });

  it('returns false if not all required fields of customMetadata are filled', () => {
    const customRequired = isCustomMetadataValid(metadata);
    expect(customRequired).to.equal(false);
  });

  it('returns true if all required fields of customMetadata are nonempty', () => {
    //fields 1 and venus are the required fields.
    metadata.customMetadata['second'][1].value = 'venus';

    const customRequired = isCustomMetadataValid(metadata);
    expect(customRequired).to.equal(true);
  });

  it('returns false if not all required metadata are filled', () => {
    const standardValid = isMetadataValid(metadata);
    expect(standardValid).to.equal(false);
  });

  it('returns true if all required metadata are nonempty', () => {
    metadata.name = 'name';
    metadata.attributionLink = 'google.com';
    metadata.customMetadata['second'][1].value = 'venus';

    const standardValid = isMetadataValid(metadata);
    expect(standardValid).to.equal(true);
  });

});

describe('view testing', () => {
  let state;

  beforeEach(() => {
    state = emptyForName('');
  });

 it('returns that there is no required text if next has not been clicked', () => {
   const element = renderComponent(view( {metadata: state, onMetadataAction: _.noop }));
   expect(element.querySelector('.textPrompt.contactEmail')).to.exist;
   expect(element.querySelector('.error.customField')).to.not.exist;
 });

 it('returns that there is required text if next has been clicked and all required fields are not filled', () => {
   state.nextClicked = true;
   const element = renderComponent(view( {metadata: state, onMetadataAction: _.noop } ), state);

   expect(element.querySelector('.error.customField')).to.exist;
 });

 it('returns that there is no required text if next has been clicked but all required fields are filled', () => {
   state.name = 'name';
   state.attributionLink = 'google.com';
   state.customMetadata['second'][1].value = 'venus';
   state.nextClicked = true;

   const element = renderComponent(view( {metadata: state, onMetadataAction:_.noop } ), state);
   expect(element.querySelector('.error.customField')).to.not.exist;
 });

 it('returns that clicking next fires onMetadataAction', () => {
   const spy = sinon.spy();
   const element = renderComponent(view( {metadata: state, onMetadataAction: spy }));
   expect(spy.callCount).to.equal(0);

   TestUtils.Simulate.click(element.querySelector('.button.nextButton'));
   expect(spy.callCount).to.equal(1);
 });

 it('returns that inserting text into a standard field fires onMetadataAction for each action', () => {
   const spy = sinon.spy();
   const element = renderComponent(view( {metadata: state, onMetadataAction: spy }));
   expect(spy.callCount).to.equal(0);

   const node = element.querySelector('.textPrompt.required.error');
   node.value = 'first';
   TestUtils.Simulate.change(node);
   expect(spy.callCount).to.equal(1);

   node.value = 'name';
   TestUtils.Simulate.change(node);
   expect(spy.callCount).to.equal(2);
 });

 it('returns that inserting text into a custom field fires onMetadataAction for each action', () => {
   const spy = sinon.spy();
   const element = renderComponent(view( {metadata: state, onMetadataAction: spy }));
   expect(spy.callCount).to.equal(0);

   const node = element.querySelector('.venus');
   node.value = 'mars';
   TestUtils.Simulate.change(node);
   expect(spy.callCount).to.equal(1);

   node.value = 'uranus';
   TestUtils.Simulate.change(node);
   expect(spy.callCount).to.equal(2);
 });

});

describe('testing for lastSaved', () => {
  let metadata, lastSavedMetadata;

  describe('last saved testing', () => {
    it('returns that wizard intializes metadata and lastSaved equally', () => {
      const state = initialNewDatasetModel({});
      metadata = state.metadata;
      lastSavedMetadata = state.lastSavedMetadata;

      expect(metadata).to.deep.equal(lastSavedMetadata);
    });

    it('returns that an unsaved wizard does not update lastSaved to equal metadata', () => {
      const state = initialNewDatasetModel({});
      metadata = state.metadata;
      lastSavedMetadata = state.lastSavedMetadata;
      metadata = update(metadata, updateContactEmail('wombats@australia.au'));

      expect(metadata).to.not.deep.equal(lastSavedMetadata);
    });

    it('returns that the saved wizard updates lastSaved to equal metadata', () => {
      const state = initialNewDatasetModel({});
      metadata = state.metadata;
      lastSavedMetadata = state.lastSavedMetadata;
      metadata = update(metadata, updateContactEmail('wombats@australia.au'));
      lastSavedMetadata = updateForLastSaved(lastSavedMetadata, updateLastSaved(metadata));

      expect(metadata).to.deep.equal(lastSavedMetadata);
    });
  });


});
