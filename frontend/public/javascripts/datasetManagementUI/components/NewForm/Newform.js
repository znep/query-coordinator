import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import * as Selectors from 'selectors';

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
//   inputType : String,
//   options: Array String,
//   placeholder : String,
//   value : String
// }
// Field is an object that holds all data needed to render a form field in DSMUI

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
    options: field.options,
    inputType: field.type === 'fixed' ? 'select' : 'text'
  }));
}

// RawFieldset :: {
//   name : String,
//   fields : Array RawField
// }

// Fieldset :: {
//   title : String,
//   subtitle : String,
//   fields : Array Field
// }

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

const fieldsets = {
  titleAndDescription: {
    title: I18n.metadata_manage.dataset_tab.titles.dataset_title,
    subtitle: I18n.metadata_manage.dataset_tab.subtitles.dataset_subtitle,
    fields: [
      {
        name: 'name',
        label: I18n.edit_metadata.dataset_title,
        placeholder: I18n.edit_metadata.dataset_title,
        inputType: 'text'
      },
      {
        name: 'description',
        label: I18n.edit_metadata.brief_description,
        placeholder: I18n.edit_metadata.brief_description_prompt,
        inputType: 'textarea'
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
        inputType: 'text'
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
        inputType: 'select'
      },
      {
        name: 'tags',
        label: I18n.edit_metadata.tags_keywords,
        placeholder: I18n.edit_metadata.dataset_tags,
        inputType: 'tagsInput'
      }
    ]
  },
  licensingAndAttribution: {
    title: I18n.metadata_manage.dataset_tab.titles.licenses_title,
    fields: [
      {
        name: 'licenseId',
        label: I18n.edit_metadata.license_type,
        inputType: 'select'
      },
      {
        name: 'attribution',
        label: I18n.edit_metadata.attribution,
        placeholder: I18n.edit_metadata.dataset_attribution,
        inputType: 'text'
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
        inputType: 'text'
      }
    ]
  },
  attachements: {
    title: I18n.metadata_manage.dataset_tab.titles.attachments_title,
    subtitle: I18n.metadata_manage.dataset_tab.subtitles.attachments_subtitle,
    fields: [
      {
        name: 'attachments',
        inputType: 'attachmentsInput'
      }
    ]
  }
};

function createFieldsets(rawFieldsets) {
  return {
    ...fieldsets,
    ...shapeCustomFieldsets(rawFieldsets)
  };
}

function xx(fieldsets, revision) {
  return Object.keys(fieldsets).reduce(
    (acc, key) => ({
      ...acc,
      [key]: {
        ...fieldsets[key],
        fields: addValues(fieldsets[key].fields, key, revision)
      }
    }),
    {}
  );
}

// addValues :: Array Field ->  Revision -> Array Field
function addValues(fields = [], fieldsetName, revision) {
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

class NewForm extends Component {
  constructor() {
    super();

    this.state = {
      datasetForm: {},
      columnForm: {}
    };

    this.handleChange = this.handleChange.bind(this);
  }

  componentWillMount() {
    this.setState({
      datasetForm: this.props.datasetMetadata,
      columnForm: this.props.outputSchemaColumns
    });
  }

  handleChange(formName, fieldName, value) {
    this.setState({
      [formName]: {
        ...this.state[formName],
        [fieldName]: value
      }
    });
  }

  render() {
    return (
      <div>
        <pre style={{ whiteSpace: 'pre-wrap', width: 700, paddingLeft: 20 }}>
          {JSON.stringify(this.state)}
          {JSON.stringify(this.props.fs)}
        </pre>;
        {this.props.children &&
          React.cloneElement(this.props.children, {
            ...this.props,
            ...this.state,
            handleChange: this.handleChange
          })}
      </div>
    );
  }
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
  const revision = getRevision(entities.revisions, revisionSeq);
  const customFieldsets = entities.views[params.fourfour].customMetadataFieldsets;
  const datasetMetadata = revision.metadata || {};
  const outputSchemaColumns = getOutputSchemaCols(entities, outputSchemaId) || {};

  return {
    datasetMetadata,
    outputSchemaColumns,
    fs: xx(createFieldsets(customFieldsets), revision)
  };
};

export default connect(mapStateToProps)(NewForm);
