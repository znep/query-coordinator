import { connect } from 'react-redux';
import _ from 'lodash';
import * as Selectors from 'selectors';
import ManageMetadata from 'components/ManageMetadata/ManageMetadata';

// ==========
// DATA MODEL
// ==========
// RawField :: {
//   name : String,
//   required : Boolean,
//   private : Boolean,
//   type : String,
//   options : Array String
// }
// RawFields are objects representing custom metadata fields as returned from Rails;
// they lack some of the information we need to display them in DSMUI

// Field :: {
//   name : String,
//   label : String,
//   isCustom : Boolean,
//   isRequired : Boolean,
//   elementType : String,
//   options: Array String,
//   placeholder : String,
//   value : String
// }
// Field is an object that holds all data needed to render a form field in DSMUI

// RawFieldset :: {
//   name : String,
//   fields : Array RawField
// }
// Same story as above; This is a fieldset that comes straight from rails...

// Fieldset :: {
//   title : String,
//   subtitle : String,
//   fields : Array Field
// }
// ...and this is the shape that dsmui's metadata form expects

// The standard, non-custom fieldsets. Here we just define non-dynamic properties.
// The initial values of the fields come in ansynchronously from the server
const FIELDSETS = {
  titleAndDescription: {
    title: I18n.metadata_manage.dataset_tab.titles.dataset_title,
    subtitle: I18n.metadata_manage.dataset_tab.subtitles.dataset_subtitle,
    fields: [
      {
        name: 'name',
        label: I18n.edit_metadata.dataset_title,
        placeholder: I18n.edit_metadata.dataset_title,
        elementType: 'text'
      },
      {
        name: 'description',
        label: I18n.edit_metadata.brief_description,
        placeholder: I18n.edit_metadata.brief_description_prompt,
        elementType: 'textarea'
      }
    ]
  },
  rowLabel: {
    title: I18n.metadata_manage.dataset_tab.titles.row_label_title,
    subtitle: I18n.edit_metadata.row_label_help,
    fields: [
      {
        name: 'rowLabel',
        label: I18n.edit_metadata.row_label,
        placeholder: I18n.edit_metadata.row_label_prompt,
        elementType: 'text'
      }
    ]
  },
  categoriesAndTags: {
    title: I18n.metadata_manage.dataset_tab.titles.tags_title,
    subtitle: I18n.metadata_manage.dataset_tab.subtitles.tags_subtitle,
    fields: [
      {
        name: 'category',
        label: I18n.edit_metadata.category,
        options: window.initialState.datasetCategories,
        elementType: 'select'
      },
      {
        name: 'tags',
        label: I18n.edit_metadata.tags_keywords,
        placeholder: I18n.edit_metadata.dataset_tags,
        elementType: 'tagsInput'
      }
    ]
  },
  licensingAndAttribution: {
    title: I18n.metadata_manage.dataset_tab.titles.licenses_title,
    fields: [
      {
        name: 'licenseId',
        label: I18n.edit_metadata.license_type,
        options: window.initialState.datasetLicenses,
        elementType: 'select'
      },
      {
        name: 'attribution',
        label: I18n.edit_metadata.attribution,
        placeholder: I18n.edit_metadata.dataset_attribution,
        elementType: 'text'
      }
    ]
  },
  contactInfo: {
    title: I18n.metadata_manage.dataset_tab.titles.contact_title,
    fields: [
      {
        name: 'contactEmail',
        label: I18n.edit_metadata.email_address,
        placeholder: I18n.edit_metadata.dataset_email,
        elementType: 'text',
        isPrivate: true
      }
    ]
  },
  attachements: {
    title: I18n.metadata_manage.dataset_tab.titles.attachments_title,
    subtitle: I18n.metadata_manage.dataset_tab.subtitles.attachments_subtitle,
    fields: [
      {
        name: 'attachments',
        elementType: 'attachmentsInput'
      }
    ]
  }
};

// =====================
// DATA HELPER FUNCTIONS
// =====================
// shapeCustomFields :: Array RawField -> Array Field
// shapeCustomFields takes the fields that come from Rails and reshapes them so
// they can be used in dsmui; the array of fields correspond to all fields in a
// fieldset
export function shapeCustomFields(fields = []) {
  return fields.map(field => ({
    name: field.name,
    label: field.name,
    isCustom: true,
    isRequired: field.required,
    options: field.options
      ? field.options.map(option => ({
        title: option,
        value: option
      }))
      : null,
    elementType: field.type === 'fixed' ? 'select' : 'text'
  }));
}

// shapeCustomFieldsets :: Array RawFieldset -> {[String] : Fieldset}
// shapeCustomFieldsets takes the data that comes from the Rails server and
// reshapes it so it can be used in DSMUI to render the dataset form
function shapeCustomFieldsets(fieldsets = []) {
  return fieldsets.reduce((acc, fs) => {
    return {
      ...acc,
      [fs.name]: {
        title: fs.name,
        fields: shapeCustomFields(fs.fields)
      }
    };
  }, {});
}

// createFieldsets :: Array RawFieldset -> { [String] : Fieldset }
// shapes custom fieldsets that come in from rails and combines them with
// the predefined fieldsets
function createFieldsets(rawFieldsets) {
  return {
    ...FIELDSETS,
    ...shapeCustomFieldsets(rawFieldsets)
  };
}

// keyByName :: Array Field -> { [String] : Field }
// turns a Fieldset's Field array into an object, so the we can more easily
// access it
function keyByName(fields = []) {
  return fields.reduce(
    (acc, field) => ({
      ...acc,
      [field.name]: {
        ...field
      }
    }),
    {}
  );
}

// addFieldValuesAll :: { [String] : Fieldset } -> Revision -> { [String] : Fieldset }
// looks up the value for all fields of all fieldsets in the form and adds it to
// the field object under the 'value' key.
function addFieldValuesAll(fieldsets, revision) {
  return Object.keys(fieldsets).reduce(
    (acc, key) => ({
      ...acc,
      [key]: {
        ...fieldsets[key],
        fields: keyByName(addFieldValues(fieldsets[key].fields, key, revision))
      }
    }),
    {}
  );
}

// addValues :: Array Field -> String -> Revision -> Array Field
// Looks up the value of each field in a single fieldset. The semi-complicated
// conditional is due to the fact that the server demands that different categories
// of metadata (e.g. private, custom, etc) be stored in a particular part of the
// revision. This was done to appease core, which does a similar thing.
// Note: we specify the path for `_.get` with an array of strings rather than
// just a string. This is to account for weird custom field/fieldset names. E.g
// a field name like `*anu@@` would cause problems with `_.get` string syntax.
export function addFieldValues(fields = [], fieldsetName, revision) {
  return fields.map(field => {
    if (field.isCustom && field.isPrivate) {
      return {
        ...field,
        value: _.get(revision, ['metadata', 'privateMetadata', 'custom_fields', fieldsetName, field.name], '')
      };
    } else if (field.isCustom) {
      return {
        ...field,
        value: _.get(revision, ['metadata', 'metadata', 'custom_fields', fieldsetName, field.name], '')
      };
    } else if (field.isPrivate) {
      return {
        ...field,
        value: _.get(revision, ['metadata', 'privateMetadata', field.name], '')
      };
    } else {
      return {
        ...field,
        value: _.get(revision, ['metadata', field.name], '')
      };
    }
  });
}

// isNumber :: Any -> Boolean
// verifies its input is a number, exluding NaN; _.isNumber(NaN) returns true, which
// we don't want here
function isNumber(x) {
  return typeof x === 'number' && !isNaN(x);
}

// getOutputSchemaCols :: Entities -> Number -> Array OutputColumn | undefined
export function getOutputSchemaCols(entities, outputSchemaId) {
  let cols;

  if (isNumber(outputSchemaId)) {
    cols = Selectors.columnsForOutputSchema(entities, outputSchemaId);
  }

  return cols;
}

//  getRevision :: Revisions -> Number -> Revision | undefined
// Attempts to find a revision by its revision sequence number; if it fails to
// find a revision, it returns undefined
export function getRevision(revisions = {}, revisionSeq) {
  let rev;

  if (isNumber(revisionSeq)) {
    rev = Object.values(revisions).find(r => r.revision_seq === revisionSeq);
  }

  return rev;
}

const mapStateToProps = ({ entities }, { params }) => {
  const revisionSeq = Number(params.revisionSeq);
  const outputSchemaId = Number(params.outputSchemaId);
  const revision = getRevision(entities.revisions, revisionSeq) || {};
  const customFieldsets = entities.views[params.fourfour].customMetadataFieldsets;
  const datasetMetadata = addFieldValuesAll(createFieldsets(customFieldsets), revision);
  const outputSchemaColumns = getOutputSchemaCols(entities, outputSchemaId) || {};

  return {
    datasetMetadata,
    outputSchemaColumns
  };
};

export default connect(mapStateToProps)(ManageMetadata);
