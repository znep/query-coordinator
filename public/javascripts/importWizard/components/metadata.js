import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import { combineReducers } from 'redux';
import RadioGroup from 'react-radio-group';
import customMetadataSchema from 'customMetadataSchema';
import datasetCategories from 'datasetCategories';
import * as Server from '../server';
import * as Utils from '../utils';
import FlashMessage from './flashMessage';

// == Metadata

type DatasetMetadata = {
  nextClicked: boolean,
  apiCall: Object,
  lastSaved: Object,
  contents: Object
}

export function defaultCustomData() {
  return Utils.fromPairs(customMetadataSchema.map(({fields, name}) => {
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

export function emptyContents(name: string) {
  return {
    name: name,
    description: '',
    category: '',
    tags: [],
    rowLabel: '',
    attributionLink: '',
    customMetadata: defaultCustomData(customMetadataSchema),
    contactEmail: '',
    privacySettings: 'private'
  };
}

export function emptyForName(name: string): DatasetMetadata {
  const lastMetadataSaved = _.cloneDeep(emptyContents(name));
  return {
    nextClicked: false,
    apiCall: {type: 'Not Started'},
    lastSaved: lastMetadataSaved,
    contents: emptyContents(name)
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

const MD_UPDATE_ATTRIBUTIONLINK = 'MD_UPDATE_ATTRIBUTIONLINK';
export function updateAttributionLink(newAttributionLink: string) {
  return {
    type: MD_UPDATE_ATTRIBUTIONLINK,
    newAttributionLink: newAttributionLink
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
  const x = _.cloneDeep(savedMetadata);
  return {
    type: MD_LAST_SAVED,
    savedMetadata: x
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

export const update =
  combineReducers({
    nextClicked: updateForNextClicked,
    apiCall: updateAPI,
    contents: updateContents,
    lastSaved: updateForLastSaved
  });

export function updateForLastSaved(lastSavedMetadata = emptyContents(''), action) {
  switch (action.type) {
    case MD_LAST_SAVED:
      return _.cloneDeep(action.savedMetadata.contents);
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
    case MD_UPDATE_ATTRIBUTIONLINK:
      return {
        ...contents,
        attributionLink: action.newAttributionLink
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
    default:
      return contents;
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

export function updateAPI(apiCallState = {type: 'Not Started'}, action) {
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
  attributionLink: bool
}

export function validate(metadata): MetadataValidationErrors {
  return {
    name: metadata.contents.name.length !== 0,
    attributionLink: metadata.contents.attributionLink.length !== 0
  };
}

export function isStandardMetadataValid(contents) {
  const valid = validate(contents);
  return valid.name && valid.attributionLink;
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

export function isMetadataValid(metadata: DatasetMetadata) {
  return (isStandardMetadataValid(metadata) && isCustomMetadataValid(metadata));
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
        <label className={field.required ? 'required' : 'optional'}>{field.name}</label>
        {renderSingleField(metadata, field, onMetadataAction, setName, fieldIdx)}
        {(isRequiredCustomFieldMissing(metadata, field, setName, fieldIdx) && metadata.nextClicked)
          ? <label htmlFor="view_fields" className="error customField">{I18n.core.validation.required}</label>
          : null
        }
        {(field['private'])
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
          <h1 htmlFor="view_customMetadataName">{set.name}</h1>
          {renderFieldSet(metadata, set, set.name, onMetadataAction)}
        </div>
      )}
    </div>
  );
}

function renderFlashMessage(importError) {
  if (_.isUndefined(importError)) {
    return;
  }
  return <FlashMessage flashType="error" message={importError} />;
}

function isMetadataUnsaved(metadata) {
  const contents = metadata.contents;
  const lastSaved = metadata.lastSaved;
  return !(_.isEqual(contents, lastSaved));
}

export function view({ metadata, onMetadataAction, importError }) {
  const I18nPrefixed = I18n.screens.edit_metadata;
  const validationErrors = validate(metadata);

  return (
    <div className="metadataPane">
      {renderFlashMessage(importError)}
      <p className="headline">{I18n.screens.dataset_new.metadata.prompt}</p>
      <div className="commonForm metadataForm">
        <div className="externalDatasetMetadata">
          <div className="line clearfix">
            <label className="required">{I18nPrefixed.dataset_url}</label>
            <input
              type="text"
              name="external_sources[0]"
              className="textPrompt url required"
              title={I18nPrefixed.dataset_url_prompt} />
          </div>
        </div>

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
              {(!validationErrors.name && metadata.nextClicked) ?
                <label htmlFor="view_name" className="error name">{I18n.screens.dataset_new.errors.missing_name}</label> : null}
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
          </div>

          <div className="line clearfix">
            <label htmlFor="view_rowLabel">{I18nPrefixed.row_label}</label>
            <input
              type="text"
              name="view[rowLabel]"
              className="textPrompt"
              value={metadata.contents.rowLabel}
              onChange={(evt) => onMetadataAction(updateRowLabel(evt.target.value))} />
          </div>
        </div>

        <div className="attributionLinkMetadata">
          <div className="line clearfix">
            <label htmlFor="view_attributionLink" className="required">
              {I18n.screens.dataset_new.metadata.esri_map_layer_url}
            </label>
            <input
              type="text"
              name="view[attributionLink]"
              className="textPrompt required"
              value={metadata.contents.attributionLink}
              onChange={(evt) => onMetadataAction(updateAttributionLink(evt.target.value))} />
            {(!validationErrors.attributionLink && metadata.nextClicked) ?
              <label htmlFor="view_attributionLink" className="error">{I18n.screens.dataset_new.errors.missing_esri_url}</label> : null}
          </div>
        </div>

        {renderCustomMetadata(metadata, onMetadataAction)}

        <div className="licensingMetadata">
          {/* TODO: license editor */}
        </div>

        <div className="attachmentsMetadata">
          <h2>{I18nPrefixed.attachments}</h2>
          <div className="attachmentsHowtoMessage">
            {I18nPrefixed.attachmentsDisabledMessagePart1}
            {' '}<span className="about"><span className="icon"></span>{I18nPrefixed.about}</span>{' '}
            {I18nPrefixed.attachmentsDisabledMessagePart2}
          </div>
        </div>

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

          <div className="line clearfix">
            <label htmlFor="{sanitize_to_id('view[contactEmail]')}">
              {I18nPrefixed.contact_email}
            </label>
            <input
              type="text"
              name="view[contactEmail]'"
              value={metadata.contents.contactEmail}
              title={I18nPrefixed.email_address} className="textPrompt contactEmail"
              onChange={(evt) => onMetadataAction(updateContactEmail(evt.target.value))} />
            <div className="additionalHelp">{I18nPrefixed.email_help}</div>
            {(metadata.apiCall.type === 'Error') ?
              <label className="error email_help">{I18n.core.validation.email}</label> : null}
          </div>
        </div>

        <div className="required">{I18nPrefixed.required_field}</div>

        <ul className="wizardButtons clearfix" aria-live="polite">
          <li className="cancel">
            <a className="button cancelButton" href="#cancel">{I18n.screens.wizard.cancel}</a>
          </li>
          <li className="save">
            <a
              className="button saveButton"
              href="#save"
              onClick={() => {
                onMetadataAction(metadataSaveStart());
                if (isMetadataUnsaved(metadata) && isMetadataValid(metadata)) {
                  onMetadataAction(updateLastSaved(metadata));
                  onMetadataAction(metadataSaveComplete(metadata.contents));
                }
              }}>
              {'Save'}
            </a>
          </li>
          <li className="next">
            <a
              className="button nextButton"
              href="#"
              onClick={() => {
                onMetadataAction(updateNextClicked());
                onMetadataAction(metadataSaveStart());
                if (isMetadataValid(metadata)) {
                  onMetadataAction(Server.saveMetadataThenProceed());
                  onMetadataAction(updateLastSaved(metadata));
                }
              }}>{I18n.screens.wizard.next}</a>
          </li>
          <li className="prev">
            <a className="button prevButton" href="#">{I18n.screens.wizard.previous}</a>
          </li>
        </ul>

      </div>
    </div>
  );
}

view.propTypes = {
  metadata: PropTypes.object.isRequired,
  onMetadataAction: PropTypes.func.isRequired,
  importError: PropTypes.string
};
