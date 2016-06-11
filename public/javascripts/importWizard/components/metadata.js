import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars

import * as Server from '../server';

import datasetCategories from 'datasetCategories';

// == Metadata

type DatasetMetadata = {
  name: string,
  description: string,
  category: string,
  tags: string,
  rowLabel: string,
  mapLayer: string,
  privacySettings: string,
  contactEmail: string
}


export function emptyForName(name: string): DatasetMetadata {
  return {
    name: name,
    description: '',
    privacySettings: 'private'
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

export const METADATA_NEXT = 'METADATA_NEXT';
export function metadataNext() {
  return {
    type: METADATA_NEXT
  };
}


export function update(metadata: DatasetMetadata = emptyForName(''), action): DatasetMetadata {
  switch (action.type) {
    case MD_UPDATE_NAME:
      return {
        ...metadata,
        name: action.newName
      };
    case MD_UPDATE_DESCRIPTION:
      return {
        ...metadata,
        description: action.newDescription
      };
    case MD_UPDATE_CATEGORY:
      return {
        ...metadata,
        category: action.newCategory
      };
    case MD_UPDATE_TAGS:
      return {
        ...metadata,
        tags: action.newTags
      };
    case MD_UPDATE_ROWLABEL:
      return {
        ...metadata,
        rowLabel: action.newRowLabel
      };
    case MD_UPDATE_MAPLAYER:
      return {
        ...metadata,
        mapLayer: action.newMapLayer
      };
    case MD_UPDATE_PRIVACYSETTINGS:
      return {
        ...metadata,
        privacySettings: action.newPrivacySettings
      };
    case MD_UPDATE_CONTACTEMAIL:
      return {
        ...metadata,
        contactEmail: action.newContactEmail
      };
    default:
      return metadata;
  }
}

export function view({ metadata, onMetadataAction }) {
  const I18nPrefixed = I18n.screens.edit_metadata;

  return (
    <div className="metadataPane">
      <div className="flash"></div>
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
              className="textPrompt required"
              value={metadata.name}
              onChange={(evt) => onMetadataAction(updateName(evt.target.value))} />
          </div>

          <div className="line clearfix">
            <label htmlFor="view_description">{I18nPrefixed.brief_description}</label>
            <textarea
              type="text"
              name="view[description]"
              title={I18nPrefixed.brief_description_prompt} className="textPrompt"
              placeholder={I18nPrefixed.brief_description_prompt}
              onChange={(evt) => onMetadataAction(updateDescription(evt.target.value))} />
          </div>

          <div className="line clearfix">
            <label htmlFor="view_category">{I18nPrefixed.category}</label>
            <select name="view[category]" onChange={(evt) => onMetadataAction(updateCategory(evt.target.value))}>
              {datasetCategories.map(([name, value]) => <option value={value}>{name}</option> )}
            </select>
          </div>

          <div className="line clearfix">
            <label htmlFor="view_tags">{I18nPrefixed.tags_keywords}</label>
            <input
              type="text" name="view[tags]"
              title={I18nPrefixed.tags_prompt}
              className="textPrompt"
              onChange={(evt) => onMetadataAction(updateTags(evt.target.value))} />
          </div>

          <div className="line clearfix">
            <label htmlFor="view_rowLabel">{I18nPrefixed.row_label}</label>
            <input
              type="text"
              name="view[rowLabel]"
              className="textPrompt"
              onChange={(evt) => onMetadataAction(updateRowLabel(evt.target.value))} />
          </div>
        </div>

        <div className="mapLayerMetadata">
          <div className="line clearfix">
            <label htmlFor="view_mapLayer" className="required">
              {I18n.screens.dataset_new.metadata.esri_map_layer_url}
            </label>
            <input
              type="text"
              name="view[mapLayer]"
              className="textPrompt required"
              onChange={(evt) => onMetadataAction(updateMapLayer(evt.target.value))} />
          </div>
        </div>

        <div className="licensingMetadata">
          {/* TODO: license editor */}
        </div>

        <div className="attachmentsMetadata">
          <h2>{I18nPrefixed.attachments}</h2>
          <div className="attachmentsHowtoMessage">{I18nPrefixed.attachmentsDisabledMessagePart1}
            <span className="about"><span className="icon"></span>{I18nPrefixed.about}</span>
            {I18nPrefixed.attachmentsDisabledMessagePart2}
          </div>
        </div>

        {/* TODO custom metadata editor */}

        <div className="privacyMetadata">
          <h2>{I18n.screens.dataset_new.metadata.privacy_security}</h2>

          <div className="line clearfix">
            <fieldset id="privacy-settings" className="radioblock">
              <legend id="privacy-settings-legend">
                {I18n.screens.dataset_new.metadata.privacy_settings}
              </legend>
              <div>
                <input
                  type="radio"
                  name="privacy"
                  value="public" id="privacy_public"
                  onChange={(evt) => onMetadataAction(updatePrivacySettings(evt.target.value))} />
                <label
                  htmlFor="privacy_public"
                  dangerouslySetInnerHTML={{__html: I18n.screens.dataset_new.metadata.public_explain}} />
              </div>
              <div>
                <input
                  type="radio"
                  name="privacy"
                  value="private"
                  id="privacy_private"
                  defaultChecked
                  onChange={(evt) => onMetadataAction(updatePrivacySettings(evt.target.value))} />
                <label
                  htmlFor="privacy_private"
                  dangerouslySetInnerHTML={{__html: I18n.screens.dataset_new.metadata.private_explain}} />
              </div>
            </fieldset>
          </div>

          <div className="line clearfix">
            <label htmlFor="{sanitize_to_id('view[contactEmail]')}">
              {I18nPrefixed.contact_email}
            </label>
            <input
              type="text"
              name="view[contactEmail]'"
              title={I18nPrefixed.email_address}
              className="textPrompt email"
              onChange={(evt) => onMetadataAction(updateContactEmail(evt.target.value))} />
            <div className="additionalHelp">{I18nPrefixed.email_help}</div>
          </div>
        </div>

        <div className="required">{I18nPrefixed.required_field}</div>
      </div>
      <a className="button nextButton" onClick={() => onMetadataAction(Server.saveMetadata())}>
        {I18n.screens.wizard.next}
      </a>
    </div>
  );
}

view.propTypes = {
  metadata: PropTypes.object.isRequired,
  onMetadataAction: PropTypes.func.isRequired
};
