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
  updateMapLayer,
  updatePrivacySettings,
  updateContactEmail,
  updateNextClicked,
  updateLastSaved,
  updateLicenseName,
  updateLicensing,
  updateLicenseSourceLink,
  updateLicenseAttribution,
  validate,
  isStandardMetadataValid,
  isCustomMetadataValid,
  isEmailValid,
  isMetadataValid,
  isMetadataUnsaved,
  isAttributionValid,
  view,
  isProviderRequired,
  showMapLayer
} from 'components/metadata';

import { initialNewDatasetModel } from 'wizard';

describe("metadata's reducer testing", () => {
  let state;

  beforeEach(() => {
    state = emptyForName('test dataset');
  });

  describe('SET_NAME', () => {
    it('sets the name of the dataset', () => {
      const result = update(state, updateName('wombats'));
      expect(result.contents.name).to.equal('wombats');
    });
  });

  describe('SET_DESCRIPTION', () => {
    it('sets the description of the dataset', () => {
      const result = update(state, updateDescription('wombats'));
      expect(result.contents.description).to.equal('wombats');
    });
  });

  describe('SET_CATEGORY', () => {
    it('sets the category of the dataset', () => {
      const result = update(state, updateCategory('Personal'));
      expect(result.contents.category).to.equal('Personal');
    });
  });

  describe('SET_TAGS', () => {
    it('sets the tags of the dataset', () => {
      const result = update(state, updateTags('wombats,pandas'));
      expect(result.contents.tags[0]).to.equal('wombats');
      expect(result.contents.tags[1]).to.equal('pandas');
    });
  });

  describe('SET_ROWLABEL', () => {
    it('sets the row label of the dataset', () => {
      const result = update(state, updateRowLabel('wombats'));
      expect(result.contents.rowLabel).to.equal('wombats');
    });
  });

  describe('SET_MAPLAYER', () => {
    it('sets the attribution link url of the dataset', () => {
      const result = update(state, updateMapLayer('wombats.au'));
      expect(result.contents.mapLayer).to.equal('wombats.au');
    });
  });

  describe('CHECK_PRIVACY_INITIALIZATION_PRIVATE', () => {
    it('checks initial privacy of the dataset', () => {
      expect(state.contents.privacySettings).to.equal('private');
    });
  });

  describe('SET_PRIVACY_PUBLIC', () => {
    it('sets the privacy of the dataset to public', () => {
      const result = update(state, updatePrivacySettings('public'));
      expect(result.contents.privacySettings).to.equal('public');
    });
  });

  describe('SET_PRIVACY_PRIVATE', () => {
    it('sets the privacy of the dataset to private', () => {
      state.contents.privacySettings = 'public';

      const result = update(state, updatePrivacySettings('private'));
      expect(result.contents.privacySettings).to.equal('private');
    });
  });

  describe('SET_EMAIL', () => {
    it('sets the contact email of the dataset', () => {
      const result = update(state, updateContactEmail('wombats@australia.au'));
      expect(result.contents.contactEmail).to.equal('wombats@australia.au');
    });
  });

  describe('SET_NEXTCLICKED', () => {
    it('sets nextClicked to true once the next button is clicked', () => {
      expect(state.nextClicked).to.equal(false);

      const result = update(state, updateNextClicked());
      expect(result.nextClicked).to.equal(true);
    });
  });

  describe('SET_LICENSE', () => {
    it('sets licenseName to Public Domain', () => {
      const result = update(state, updateLicenseName('Public Domain'));
      expect(result.license.licenseName).to.equal('Public Domain');
      expect(result.license.licensing).to.equal('');
      expect(result.license.licenseId).to.equal('PUBLIC_DOMAIN')
    });

    it('sets licenseName to Creative Commons and expect a licensing', () => {
      const result = update(state, updateLicenseName('Creative Commons'));

      expect(result.license.licenseName).to.equal('Creative Commons');
      expect(result.license.licensing).to.equal('1.0 Universal (Public Domain Dedication)');
      expect(result.license.licenseId).to.equal('CC0_10');
    });

    it('sets licenseName to Creative Commons then back to Public Domain and expect no licensing', () => {
      const temp = update(state, updateLicenseName('Creative Commons'));
      const result = update(temp, updateLicenseName('Public Domain'));

      expect(result.license.licenseName).to.equal('Public Domain');
      expect(result.license.licensing).to.equal('');
      expect(result.license.licenseId).to.equal('PUBLIC_DOMAIN');
    });

    it('sets licensing', () => {
      const temp = update(state, updateLicenseName('Creative Commons'));
      const result = update(temp, updateLicensing('Attribution | No Derivative Works 3.0 Unported'));

      expect(result.license.licenseName).to.equal('Creative Commons');
      expect(result.license.licensing).to.equal('Attribution | No Derivative Works 3.0 Unported');
      expect(result.license.licenseId).to.equal('CC_30_BY_ND');
    });

    it('sets sourceLink', () => {
      const result = update(state, updateLicenseSourceLink('google.com'));

      expect(result.license.sourceLink).to.equal('google.com');
    });

    it('sets attribution', () => {
      const result = update(state, updateLicenseAttribution('me'));

      expect(result.license.attribution).to.equal('me');
    });
  });
});

describe('validators', () => {
  let metadata;

  beforeEach(() => {
    metadata = {
      nextClicked: false,
      license: {
        licenseName: 'Creative Commons',
        licensing: 'Attribution | Share Alike 3.0 Unported',
        licenseId: 'CC_30_BY_SA',
        attribution: '',
        sourceLink: ''
      },
      contents: {
        name: '',
        mapLayer: '',
        contactEmail: '',
        description: '',
        tags: [],
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
      }
    };
  });

  describe('validation testing', () => {
    describe('validate', () => {
      it('returns false for empty required keys in metadata', () => {
        const operation = 'ConnectToEsri';

        const standardValid = isStandardMetadataValid(metadata, operation);
        expect(standardValid).to.equal(false);

        const result = validate(metadata, operation);
        expect(result.name).to.equal(false);
        expect(result.mapLayer).to.equal(false);
      });
    });

    it('returns false when displayType is href and href is blank', () => {
      let md = _.cloneDeep(metadata);
      md.contents.name = 'name';
      md.contents.mapLayer = 'google.com';
      md.contents.customMetadata['second'][1].value = 'venus';
      md.license.attribution = 'attribution';
      md.contents.displayType = 'href';
      const valid = isMetadataValid(md);
      expect(valid).to.equal(false);
    });

    it('returns true when displayType is href and href is not blank', () => {
      let md = _.cloneDeep(metadata);

      md.contents.name = 'name';
      md.contents.mapLayer = 'google.com';
      md.contents.customMetadata['second'][1].value = 'venus';
      md.license.attribution = 'attribution';
      md.contents.displayType = 'href';
      md.contents.href = 'http://foo.com';
      const valid = isMetadataValid(md);
      expect(valid).to.equal(true);
    });


    it('returns true for valid values', () => {
      const operation = 'ConnectToEsri';

      metadata.contents.name = 'panda',
      metadata.contents.mapLayer = 'wombat'

      const standardValid = isStandardMetadataValid(metadata, operation);
      expect(standardValid).to.equal(true);

      const result = validate(metadata, operation);
      expect(result.name).to.equal(true);
      expect(result.mapLayer).to.equal(true);
    });

  });

  describe('isCustomMetadataValid', () => {
    it('returns false if not all required fields of customMetadata are filled', () => {
      const customRequired = isCustomMetadataValid(metadata);
      expect(customRequired).to.equal(false);
    });

    it('returns true if all required fields of customMetadata are nonempty', () => {
      //fields 1 and venus are the required fields.
      metadata.contents.customMetadata['second'][1].value = 'venus';

      const customRequired = isCustomMetadataValid(metadata);
      expect(customRequired).to.equal(true);
    });
  });

  it('validEmail returns true if email is empty', () => {
    const validEmail = isEmailValid(metadata);
    expect(validEmail).to.equal(true);
  });

  describe('isMetadataValid', () => {
    it('returns false if not all required metadata are filled', () => {
      const navigation = {
        path: ['ConnectToEsri', 'Metadata']
      };

      const standardValid = isMetadataValid(metadata);
      expect(standardValid).to.equal(false);
    });

    it('returns true if all required metadata are nonempty', () => {
      const operation = 'ConnectToEsri';

      metadata.contents.name = 'name';
      metadata.contents.mapLayer = 'google.com';
      metadata.contents.customMetadata['second'][1].value = 'venus';
      metadata.license.attribution = 'attribution';

      const valid = isMetadataValid(metadata, operation);
      expect(valid).to.equal(true);
    });

    it('showMapLayer return true', () => {
      const operation = 'ConnectToEsri';
      const valid = showMapLayer(operation);
      expect(valid).to.equal(true);
    });

    it('showMapLayer return false', () => {
      const operation = 'metadata';
      const invalid = showMapLayer(operation);
      expect(invalid).to.equal(false);
    });
  });

  describe('isMetadataUnsaved', () => {
    it('returns false if metadata has not been updated', () => {
      metadata.lastSaved = metadata.contents;
      const unsaved = isMetadataUnsaved(metadata);

      expect(unsaved).to.equal(false);
    });

    it('returns true if metadata has been updated', () => {
      metadata.lastSaved = _.cloneDeep(metadata.contents);
      metadata.contents.name = 'new name';
      const unsaved = isMetadataUnsaved(metadata);

      expect(unsaved).to.equal(true);
    });
  });

  describe('isAttributionValid', () => {
    it('returns true if attribution is not required', () => {
      metadata = update(metadata, updateLicenseName('Public Domain'));
      const attributionvalid = isAttributionValid(metadata);

      expect(attributionvalid).to.equal(true);
    });

    it('returns false if attribution is required and not provided', () => {
      const attributionvalid = isAttributionValid(metadata);

      expect(attributionvalid).to.equal(false);
    });

    it('returns true if attribution is provided', () => {
      metadata.license.attribution = 'attribution';
      const attributionvalid = isAttributionValid(metadata);

      expect(attributionvalid).to.equal(true);
    });
  });
});

describe('view testing', () => {
  let state;

  beforeEach(() => {
    state = emptyForName('');
  });

  it('shows the href component when displayType is href', () => {
    state.contents.displayType = 'href'
    const element = renderComponent(view( {metadata: state, onMetadataAction: _.noop }));
    expect(element.querySelector('.textPrompt.url')).to.exist;
  });

  it('does not show the href component when displayType is not href', () => {
    const element = renderComponent(view( {metadata: state, onMetadataAction: _.noop }));
    expect(element.querySelector('.textPrompt.url')).to.not.exist;
  });

  it('sets the href property when the href input is blurred', () => {
    state.contents.displayType = 'href';
    let emitted = {};
    const element = renderComponent(view( {metadata: state, onMetadataAction: (action) => {
      emitted = action;
    }}));

    let input = element.querySelector('input.url');
    input.value = 'foobar.com'
    TestUtils.Simulate.blur(input)

    expect(emitted.type).to.equal('MD_UPDATE_HREF');
    expect(emitted.href).to.equal('foobar.com');
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
   state.contents.name = 'name';
   state.contents.mapLayer = 'google.com';
   state.contents.customMetadata['second'][1].value = 'venus';
   state.contents.nextClicked = true;

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
  let metadata, contents, lastSavedMetadata;

  describe('last saved testing', () => {
    it('returns that wizard intializes metadata and lastSaved equally', () => {
      metadata = initialNewDatasetModel({}).metadata;
      lastSavedMetadata = metadata.lastSaved;

      expect(lastSavedMetadata).to.deep.equal({
        lastSavedContents: metadata.contents,
        lastSavedLicense: metadata.license
      });
    });

    it('returns that an unsaved wizard does not update lastSaved to equal metadata', () => {
      const state = initialNewDatasetModel({});
      metadata = state.metadata;
      lastSavedMetadata = state.metadata.lastSaved;
      metadata = update(metadata, updateContactEmail('wombats@australia.au'));

      expect(lastSavedMetadata).to.not.deep.equal({
        lastSavedContents: metadata.contents,
        lastSavedLicense: metadata.license
      });
    });

    it('returns that the saved wizard updates lastSaved to equal metadata', () => {
      const state = initialNewDatasetModel({});
      metadata = state.metadata;
      const tempLastSaved = state.metadata.lastSaved.lastSavedContents;
      metadata = update(metadata, updateContactEmail('wombats@australia.au'));
      lastSavedMetadata = updateForLastSaved(tempLastSaved, updateLastSaved(metadata));

      expect(lastSavedMetadata).to.deep.equal({
        lastSavedContents: metadata.contents,
        lastSavedLicense: metadata.license
      });
    });
  });

});
