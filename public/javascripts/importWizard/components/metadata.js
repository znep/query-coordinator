/* global blistLicenses */

import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import _ from 'lodash';
import { combineReducers } from 'redux';
import isEmail from 'validator/lib/isEmail';
import RadioGroup from 'react-radio-group';

import * as Server from '../server';
import FlashMessage from './flashMessage';
import NavigationControl from './navigationControl';

import customMetadataSchema from 'customMetadataSchema';
import datasetCategories from 'datasetCategories';
import licenses from 'licenses';

// == Metadata
type DatasetMetadata = {
  nextClicked: boolean,
  apiCall: MetadataApiCall,
  license: LicenseType,
  contents: MetadataContents,
  lastSaved: MetadataContents
}

type MetadataApiCall
  = { type: 'Not Started' }
  | { type: 'In Progress' }
  | { type: 'Error', error: any }
  | { type: 'Success', contents: MetadataContents }

type DisplayType
  = 'table'
  | 'draft'
  | 'href'


type MetadataContents = {
  name: String,
  description: String,
  category: String,
  tags: Array,
  rowLabel: String,
  mapLayer: String,
  customMetadata: Object,
  contactEmail: String,
  privacySettings: String,
  displayType: DisplayType,
  href: String
}

type LicenseType = {
  licenseName: String,
  licensing: String,
  licenseId: String,
  attribution: String,
  sourceLink: String
}

export function defaultCustomData() {
  return _.fromPairs(customMetadataSchema.map(({fields, name}) => {
    return [
      name,
      fields.map(field => ({
        field: field.name,
        value: field.options ? field.options[0] : '',
        privateField: _.has(field, 'private')
      }))
    ];
  }));
}

export function emptyContents(name: string): MetadataContents {
  return {
    name: name,
    description: '',
    category: '',
    tags: [],
    rowLabel: '',
    mapLayer: '',
    customMetadata: defaultCustomData(customMetadataSchema),
    contactEmail: '',
    privacySettings: 'private',
    displayType: 'draft',
    href: ''
  };
}

export function emptyLicense(): LicenseType {
  return {
    licenseName: '',
    licensing: '',
    licenseId: '',
    attribution: '',
    sourceLink: ''
  };
}

export function emptyForName(name: string): DatasetMetadata {
  const lastSavedContents = _.cloneDeep(emptyContents(name));
  const lastLicenseSaved = _.cloneDeep(emptyLicense());
  return {
    nextClicked: false,
    apiCall: {type: 'Not Started'},
    contents: emptyContents(name),
    license: emptyLicense(),
    lastSaved: {
      lastSavedContents: lastSavedContents,
      lastSavedLicense: lastLicenseSaved
    }
  };
}

const MD_UPDATE_NAME = 'MD_UPDATE_NAME';
export function updateName(newName: string) {
  return {
    type: MD_UPDATE_NAME,
    newName: newName
  };
}

const MD_UPDATE_DESCRIPTION = 'MD_UPDATE_DESCRIPTION';
export function updateDescription(newDescription: string) {
  return {
    type: MD_UPDATE_DESCRIPTION,
    newDescription: newDescription
  };
}

const MD_UPDATE_CATEGORY = 'MD_UPDATE_CATEGORY';
export function updateCategory(newCategory: string) {
  return {
    type: MD_UPDATE_CATEGORY,
    newCategory: newCategory
  };
}

const MD_UPDATE_TAGS = 'MD_UPDATE_TAGS';
export function updateTags(newTags: string) {
  return {
    type: MD_UPDATE_TAGS,
    newTags: newTags
  };
}

const MD_UPDATE_ROWLABEL = 'MD_UPDATE_ROWLABEL';
export function updateRowLabel(newRowLabel: string) {
  return {
    type: MD_UPDATE_ROWLABEL,
    newRowLabel: newRowLabel
  };
}

const MD_UPDATE_MAPLAYER = 'MD_UPDATE_MAPLAYER';
export function updateMapLayer(newMapLayer: string) {
  return {
    type: MD_UPDATE_MAPLAYER,
    newMapLayer: newMapLayer
  };
}

const MD_UPDATE_LICENSENAME = 'MD_UPDATE_LICENSENAME';
export function updateLicenseName(newLicenseName: string) {
  return {
    type: MD_UPDATE_LICENSENAME,
    newLicenseName: newLicenseName
  };
}

const MD_UPDATE_LICENSING = 'MD_UPDATE_LICENSING';
export function updateLicensing(newLicensing: string) {
  return {
    type: MD_UPDATE_LICENSING,
    newLicensing: newLicensing
  };
}

const MD_UPDATE_LICENSEATTRIBUTION = 'MD_UPDATE_LICENSEATTRIBUTION';
export function updateLicenseAttribution(newLicenseAttribution: string) {
  return {
    type: MD_UPDATE_LICENSEATTRIBUTION,
    newLicenseAttribution: newLicenseAttribution
  };
}

const MD_UPDATE_LICENSESOURCELINK = 'MD_UPDATE_LICENSESOURCELINK';
export function updateLicenseSourceLink(newLicenseSourceLink: string) {
  return {
    type: MD_UPDATE_LICENSESOURCELINK,
    newLicenseSourceLink: newLicenseSourceLink
  };
}

const MD_UPDATE_CUSTOMMETADATA = 'MD_UPDATE_CUSTOMMETADATA';
export function updateCustomData(newCustomData: string, setName: string, fieldIdx: number) {
  return {
    type: MD_UPDATE_CUSTOMMETADATA,
    newCustomData: newCustomData,
    setName: setName,
    fieldIdx: fieldIdx
  };
}

const MD_UPDATE_PRIVACYSETTINGS = 'MD_UPDATE_PRIVACYSETTINGS';
export function updatePrivacySettings(newPrivacySettings: string) {
  return {
    type: MD_UPDATE_PRIVACYSETTINGS,
    newPrivacySettings: newPrivacySettings
  };
}

const MD_UPDATE_CONTACTEMAIL = 'MD_UPDATE_CONTACTEMAIL';
export function updateContactEmail(newContactEmail: string) {
  return {
    type: MD_UPDATE_CONTACTEMAIL,
    newContactEmail: newContactEmail
  };
}

const MD_UPDATE_NEXTCLICKED = 'MD_UPDATE_NEXTCLICKED';
export function updateNextClicked() {
  return {
    type: MD_UPDATE_NEXTCLICKED
  };
}

const MD_LAST_SAVED = 'MD_LAST_SAVED';
export function updateLastSaved(savedMetadata) {
  return {
    type: MD_LAST_SAVED,
    savedMetadata: _.cloneDeep(savedMetadata)
  };
}

const MD_SAVE_START = 'MD_SAVE_START';
export function metadataSaveStart() {
  return {
    type: MD_SAVE_START
  };
}

const MD_SAVE_COMPLETE = 'MD_SAVE_COMPLETE';
export function metadataSaveComplete(contents) {
  return {
    type: MD_SAVE_COMPLETE,
    contents: contents
  };
}

const MD_SAVE_ERROR = 'MD_SAVE_ERROR';
export function metadataSaveError(err) {
  return {
    type: MD_SAVE_ERROR,
    err: err
  };
}

const MD_UPDATE_HREF = 'MD_UPDATE_HREF';
export function updateHref(href) {
  return {
    type: MD_UPDATE_HREF,
    href: href
  };
}


const MD_OPERATION_DISPLAY_TYPE = 'MD_OPERATION_DISPLAY_TYPE';
export function setDisplayType(operationName) {
  return {
    type: MD_OPERATION_DISPLAY_TYPE,
    operation: operationName
  };
}

export const update =
  combineReducers({
    nextClicked: updateForNextClicked,
    apiCall: updateApiCallState,
    contents: updateContents,
    license: updateLicense,
    lastSaved: updateForLastSaved
  });

export function updateForLastSaved(lastSavedMetadata = emptyContents(''), action) {
  switch (action.type) {
    case MD_LAST_SAVED:
      return {
        lastSavedContents: _.cloneDeep(action.savedMetadata.contents),
        lastSavedLicense: _.cloneDeep(action.savedMetadata.license)
      };
    default:
      return lastSavedMetadata;
  }
}

export function updateContents(contents = emptyContents(''), action): DatasetMetadata {
  switch (action.type) {
    case MD_UPDATE_NAME:
      return {
        ...contents,
        name: action.newName
      };
    case MD_UPDATE_DESCRIPTION:
      return {
        ...contents,
        description: action.newDescription
      };
    case MD_UPDATE_CATEGORY:
      return {
        ...contents,
        category: action.newCategory
      };
    case MD_UPDATE_TAGS:
      contents.tags = action.newTags.split(',');
      return {
        ...contents,
        tags: contents.tags
      };
    case MD_UPDATE_ROWLABEL:
      return {
        ...contents,
        rowLabel: action.newRowLabel
      };
    case MD_UPDATE_MAPLAYER:
      return {
        ...contents,
        mapLayer: action.newMapLayer
      };
    case MD_UPDATE_CUSTOMMETADATA: {
      const newCustomMetadata = _.cloneDeep(contents.customMetadata);
      newCustomMetadata[action.setName][action.fieldIdx].value = action.newCustomData;

      return {
        ...contents,
        customMetadata: newCustomMetadata
      };
    }
    case MD_UPDATE_PRIVACYSETTINGS:
      return {
        ...contents,
        privacySettings: action.newPrivacySettings
      };
    case MD_UPDATE_CONTACTEMAIL:
      return {
        ...contents,
        contactEmail: action.newContactEmail
      };
    case MD_OPERATION_DISPLAY_TYPE:
      return {
        ...contents,
        displayType: displayTypeFor(action.operation)
      };
    case MD_UPDATE_HREF:
      return {
        ...contents,
        href: action.href
      };
    default:
      return contents;
  }
}

function displayTypeFor(operation) {
  return {
    'LinkToExternal': 'href'
  }[operation] || 'draft';
}


export function updateLicense(license = emptyLicense(), action): LicenseType {
  switch (action.type) {
    case MD_UPDATE_LICENSENAME: {
      const licenseByName = licenseFind(action.newLicenseName);
      if (_.has(licenseByName, 'licenses')) {
        const firstLicensing = licenseByName.licenses[0];
        return {
          ...license,
          licenseName: action.newLicenseName,
          licenseId: firstLicensing.id,
          licensing: firstLicensing.name
        };
      } else {
        return {
          ...license,
          licenseName: action.newLicenseName,
          licensing: '',
          licenseId: licenses[action.newLicenseName]
        };
      }
    }
    case MD_UPDATE_LICENSING: {
      const licenseByName = licenseFind(license.licenseName).licenses;
      const newLicenseId = _.find(licenseByName, (l) => {
        return l.name === action.newLicensing;
      }).id;
      return {
        ...license,
        licensing: action.newLicensing,
        licenseId: newLicenseId
      };
    }
    case MD_UPDATE_LICENSEATTRIBUTION:
      return {
        ...license,
        attribution: action.newLicenseAttribution
      };
    case MD_UPDATE_LICENSESOURCELINK:
      return {
        ...license,
        sourceLink: action.newLicenseSourceLink
      };
    default:
      return license;
  }
}

export function updateForNextClicked(nextClicked: boolean = false, action) {
  switch (action.type) {
    case MD_UPDATE_NEXTCLICKED:
      return true;
    default:
      return nextClicked;
  }
}

export function updateApiCallState(apiCallState = {type: 'Not Started'}, action) {
  switch (action.type) {
    case MD_SAVE_START:
      return {type: 'In Progress'};
    case MD_SAVE_COMPLETE:
      return {type: 'Success', contents: action.contents};
    case MD_SAVE_ERROR:
      return {type: 'Error', error: action.err};
    default:
      return apiCallState;
  }
}

type MetadataValidationErrors = {
  name: bool,
  mapLayer: bool
}

export function validate(metadata): MetadataValidationErrors {
  return {
    name: metadata.contents.name.length !== 0,
    mapLayer: metadata.contents.mapLayer.length !== 0,
    href: isHrefValid(metadata)
  };
}

export function isStandardMetadataValid(contents) {
  const valid = validate(contents);
  return valid.name && valid.mapLayer;
}

function isHrefValid({contents: contents}) {
  if (contents.displayType === 'href') {
    return (!!contents.href) && (contents.href.length > 0);
  }
  return true;
}

function isRequiredCustomFieldMissing(metadata: DatasetMetadata, field, setName, fieldIdx) {
  return (metadata.contents.customMetadata[setName][fieldIdx].value.length === 0 && field.required);
}

export function isCustomMetadataValid(metadata: DatasetMetadata) {
  return customMetadataSchema.every((fieldSet) => {
    return fieldSet.fields.every((field, fieldIndex) => {
      if (field.required) {
        const value = metadata.contents.customMetadata[fieldSet.name][fieldIndex].value;
        return value.length > 0;
      } else {
        return true;
      }
    });
  });
}

export function isEmailValid(metadata) {
  const contactEmail = metadata.contents.contactEmail;
  return isEmail(contactEmail) || contactEmail.length === 0;
}

export function isAttributionValid(metadata) {
  return !(attributionRequiredTag(metadata) === 'required' && metadata.license.attribution.length === 0);
}

export function isMetadataValid(metadata: DatasetMetadata) {
  return isStandardMetadataValid(metadata) &&
         isCustomMetadataValid(metadata) &&
         isEmailValid(metadata) &&
         isHrefValid(metadata) &&
         isAttributionValid(metadata);
}

export function isMetadataUnsaved(metadata) {
  const contents = metadata.contents;
  const lastSaved = metadata.lastSaved;
  return !(_.isEqual(contents, lastSaved));
}

function renderSingleField(metadata, field, onMetadataAction, setName, fieldIdx) {
  if (_.has(field, 'options')) {
    const options = field.options;
    return (
      <select
        className={field.name}
        value={metadata.contents.customMetadata[setName][fieldIdx].value}
        onChange={(evt) => onMetadataAction(updateCustomData(evt.target.value, setName, fieldIdx))} >
          {options.map((value) =>
            <option value={value}>{value}</option>
            )
          }
      </select>
    );
  } else {
    return (
      <input
        type="text"
        className={field.name}
        value={metadata.contents.customMetadata[setName][fieldIdx].value}
        onChange={(evt) => onMetadataAction(updateCustomData(evt.target.value, setName, fieldIdx))} />
    );
  }
}

function renderFieldSet(metadata: DatasetMetadata, fieldSet, setName, onMetadataAction) {
  const fields = fieldSet.fields;
  return (
    <div> {fields.map((field, fieldIdx) =>
      <div className="line clearfix">
        <label
          className={field.required ? 'required' : 'optional'}>
          {field.name}
        </label>
        {renderSingleField(metadata, field, onMetadataAction, setName, fieldIdx)}
        {(isRequiredCustomFieldMissing(metadata, field, setName, fieldIdx) && metadata.nextClicked)
          ? <label htmlFor="view_fields" className="error customField">{I18n.core.validation.required}</label>
          : null
        }
        {(field.private)
          ? <div className="additionalHelp">{I18n.screens.edit_metadata.private_help}</div>
          : null
        }
      </div>
      )}
    </div>
  );
}

function renderCustomMetadata(metadata, onMetadataAction) {
  return (
    <div className="customMetadataSchema">
      {customMetadataSchema.map((set) =>
        <div>
          <h2 htmlFor="view_customMetadataName">{set.name}</h2>
          {renderFieldSet(metadata, set, set.name, onMetadataAction)}
        </div>
      )}
    </div>
  );
}

export function attributionRequiredTag(metadata) {
  const licenseName = metadata.license.licenseName;
  const licensing = metadata.license.licensing;
  if (licensing !== '') {
    const licenseByName = licenseFind(licenseName);

    if (_.has(licenseByName, 'licenses')) {
      const match = _.find(licenseByName.licenses, (l) => {
        return l.name === licensing;
      });

      return match.attribution_required
              ? 'required'
              : '';
    }
  }
  return '';
}


function licenseFind(licenseName) {
  return _.find(blistLicenses, (l) => {
    return l.name === licenseName;
  });
}

function renderHref(metadata, validationErrors, onMetadataAction) {
  var {contents: {displayType}} = metadata;
  const I18nPrefixed = I18n.screens.edit_metadata;
  if (displayType === 'href') {
    return (<div>
      <div className="line clearfix">
        <label className="required">{I18nPrefixed.dataset_url}</label>
        <input
          type="text"
          className="textPrompt url required"
          onBlur={(evt) => onMetadataAction(updateHref(evt.target.value))}
          title={I18nPrefixed.dataset_url_prompt} />
        {(!validationErrors.href && metadata.nextClicked)
          ? <label htmlFor="view_name" className="error name">{I18n.screens.dataset_new.errors.invalid_url}</label>
          : null}
      </div>
    </div>);
  }
  return;
}

function renderLicenses(metadata, onMetadataAction) {
  const licensesByName = licenseFind(metadata.license.licenseName);
  return (
    <div className="licenses">
      <h2 htmlFor="view_licenses">{I18n.screens.edit_metadata.licensing_attr}</h2>
      <div className="line clearfix">
        <label htmlFor="view_licenses">{I18n.screens.edit_metadata.license_type}</label>
        <select
          name="view[licenses]"
          value={metadata.license.licenseName}
          onChange={(evt) => onMetadataAction(updateLicenseName(evt.target.value))}>
          {blistLicenses.map((obj) => <option value={obj.name}>{obj.name}</option> )}
        </select>
      </div>

      {_.has(licensesByName, 'licenses')
      ?
        <div className="line clearfix">
          <label htmlFor="view_licensing" className="required">{I18n.screens.edit_metadata.licensing}</label>
          <select
            name="view[licensing]"
            value={metadata.license.licensing}
            onChange={(evt) => onMetadataAction(updateLicensing(evt.target.value))}>
            {licensesByName.licenses.map((obj) => <option value={obj.name}>{obj.name}</option>)}
          </select>
        </div>
      : null}

      <div className="line clearfix">
        <div className="additionalHelp">{I18n.screens.edit_metadata.license_help}</div>
      </div>

      <div className="line clearfix">
        <label
          htmlFor="view_attribution"
          className={attributionRequiredTag(metadata)}>
          {I18n.screens.edit_metadata.data_provided_by}
        </label>
        <input
          type="text"
          name="view[attribution]"
          id="view_attribution"
          value={metadata.license.attribution}
          placeholder={I18n.screens.edit_metadata.data_provided_prompt}
          onChange={(evt) => onMetadataAction(updateLicenseAttribution(evt.target.value))}
          className="textPrompt" />
          {(!isAttributionValid(metadata) && metadata.nextClicked)
            ? <label htmlFor="view_attribution" className="error">{I18n.screens.edit_metadata.data_provider_required}</label>
            : null}
      </div>

      <div className="line clearfix">
        <label htmlFor="view_attributionLink">{I18n.screens.edit_metadata.source_link}</label>
        <input
          type="text"
          name="view[attributionLink]"
          id="view_attributionLink"
          value={metadata.license.sourceLink}
          placeholder={I18n.screens.edit_metadata.source_link_prompt}
          onChange={(evt) => onMetadataAction(updateLicenseSourceLink(evt.target.value))}
          className="textPrompt" />
      </div>

    </div>
  );
}

function renderFlashMessageApiError(apiCall) {
  if (apiCall.type !== 'Error') {
    return;
  } else {
    switch (apiCall.error.message) {
      case 'Failed to fetch':
        return <FlashMessage flashType="error" message={I18n.screens.import_pane.errors.network_error} />;
      case 'Bad Gateway':
        return <FlashMessage flashType="error" message={I18n.screens.import_pane.errors.http_error.format(apiCall.error.message)} />;
      default:
        if (apiCall.error.message) {
          return <FlashMessage flashType="error" message={apiCall.error.message} />;
        } else {
          return <FlashMessage flashType="error" message={I18n.screens.import_pane.unknown_error} />;
        }
    }
  }
}

function renderFlashMessageImportError(importError) {
  if (_.isUndefined(importError)) {
    return;
  }
  return <FlashMessage flashType="error" message={importError} />;
}

export function view({ metadata, onMetadataAction, importError, goToPrevious }) {
  const I18nPrefixed = I18n.screens.edit_metadata;
  const validationErrors = validate(metadata);


  return (
    <div className="metadataPane">
      {renderFlashMessageApiError(metadata.apiCall)}
      {renderFlashMessageImportError(importError)}
      <p className="headline">{I18n.screens.dataset_new.metadata.prompt}</p>
      <div className="commonForm metadataForm">
        {renderHref(metadata, validationErrors, onMetadataAction)}

        <div className="generalMetadata">
          <div className="line clearfix">
            <label htmlFor="view_name" className="required">{I18nPrefixed.dataset_title}</label>
            <input
              type="text"
              name="view[name]"
              title={I18nPrefixed.dataset_title_prompt}
              className="textPrompt required error"
              value={metadata.contents.name}
              onChange={(evt) => onMetadataAction(updateName(evt.target.value))} />
              {(!validationErrors.name && metadata.nextClicked)
                ? <label htmlFor="view_name" className="error name">{I18n.screens.dataset_new.errors.missing_name}</label>
                : null}
          </div>

          <div className="line clearfix">
            <label htmlFor="view_description">{I18nPrefixed.brief_description}</label>
            <textarea
              type="text"
              name="view[description]"
              title={I18nPrefixed.brief_description_prompt} className="textPrompt"
              value={metadata.contents.description}
              placeholder={I18nPrefixed.brief_description_prompt}
              onChange={(evt) => onMetadataAction(updateDescription(evt.target.value))} />
          </div>

          <div className="line clearfix">
            <label htmlFor="view_category">{I18nPrefixed.category}</label>
            <select
              name="view[category]"
              value={metadata.contents.category}
              onChange={(evt) => onMetadataAction(updateCategory(evt.target.value))}>
              {datasetCategories.map(([name, value]) => <option value={value}>{name}</option> )}
            </select>
          </div>

          <div className="line clearfix">
            <label htmlFor="view_tags">{I18nPrefixed.tags_keywords}</label>
            <input
              type="text" name="view[tags]"
              title={I18nPrefixed.tags_prompt}
              value={metadata.contents.tags}
              className="textPrompt"
              onChange={(evt) => onMetadataAction(updateTags(evt.target.value))} />
            <div className="additionalHelp">{I18nPrefixed.keywords_help}</div>
          </div>

          <div className="line clearfix">
            <label htmlFor="view_rowLabel">{I18nPrefixed.row_label}</label>
            <input
              type="text"
              name="view[rowLabel]"
              className="textPrompt"
              value={metadata.contents.rowLabel}
              onChange={(evt) => onMetadataAction(updateRowLabel(evt.target.value))} />
            <div className="additionalHelp">{I18nPrefixed.row_label_help}</div>
          </div>
        </div>

        <div className="mapLayerMetadata">
          <div className="line clearfix">
            <label htmlFor="view_mapLayer" className="required">
              {I18n.screens.dataset_new.metadata.esri_map_layer_url}
            </label>
            <input
              type="text"
              name="view[esri_src]"
              className="textPrompt required"
              value={metadata.contents.mapLayer}
              onChange={(evt) => onMetadataAction(updateMapLayer(evt.target.value))} />
            {(!validationErrors.mapLayer && metadata.nextClicked)
              ? <label htmlFor="view_esri" className="error">{I18n.screens.dataset_new.errors.missing_esri_url}</label>
              : null}
          </div>
        </div>

        {renderLicenses(metadata, onMetadataAction)}

        {renderCustomMetadata(metadata, onMetadataAction)}

        <div className="privacyMetadata">
          <h2>{I18n.screens.dataset_new.metadata.privacy_security}</h2>

          <div className="line clearfix">
            <fieldset id="privacy-settings" className="radioblock">
              <legend id="privacy-settings-legend">
                {I18n.screens.dataset_new.metadata.privacy_settings}
              </legend>
              <RadioGroup
                name="privacy"
                selectedValue={metadata.contents.privacySettings}
                onChange={(value) => onMetadataAction(updatePrivacySettings(value))}>
                {Radio => (
                  <div>
                    <div>
                      <Radio value="public" />
                      <label
                        htmlFor="privacy_public"
                        dangerouslySetInnerHTML={{__html: I18n.screens.dataset_new.metadata.public_explain}} />
                    </div>
                    <div>
                      <Radio value="private" />
                      <label
                        htmlFor="privacy_private"
                        dangerouslySetInnerHTML={{__html: I18n.screens.dataset_new.metadata.private_explain}} />
                    </div>
                  </div>
                )}
              </RadioGroup>
            </fieldset>
          </div>
        </div>

        <div className="line clearfix">
          <label htmlFor="{sanitize_to_id('view[contactEmail]')}">
            {I18nPrefixed.contact_email}
          </label>
          <input
            type="text"
            name="view[contactEmail]"
            value={metadata.contents.contactEmail}
            title={I18nPrefixed.email_address} className="textPrompt contactEmail"
            onChange={(evt) => onMetadataAction(updateContactEmail(evt.target.value))} />
          <div className="additionalHelp">{I18nPrefixed.email_help}</div>
          {!isEmailValid(metadata)
            ? <label className="error email_help">{I18n.core.validation.email}</label>
            : null}
        </div>

        <div className="required">{I18nPrefixed.required_field}</div>

      </div>
      <NavigationControl
        onPrev={goToPrevious}

        onSave={() => {
          onMetadataAction(updateNextClicked());
          if ((isMetadataUnsaved(metadata) && isMetadataValid(metadata))) {
            onMetadataAction(Server.saveMetadataToViewsApi());
          }
        }}

        onNext={(() => {
          onMetadataAction(updateNextClicked());
          if (isMetadataValid(metadata)) {
            onMetadataAction(Server.saveMetadataThenProceed());
          }
        })}

        cancelLink="/profile" />

    </div>
  );
}

view.propTypes = {
  metadata: PropTypes.object.isRequired,
  onMetadataAction: PropTypes.func.isRequired,
  importError: PropTypes.string,
  goToPrevious: PropTypes.func.isRequired
};