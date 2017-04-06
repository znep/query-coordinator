import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import MetadataField from 'components/MetadataField';
import Fieldset from 'components/MetadataFields/Fieldset';
import reformed from 'components/Forms/reformed';
import validateSchema from 'components/Forms/validateSchema';
import { edit } from 'actions/database';
import * as Selectors from 'selectors';
import styles from 'styles/ManageMetadata/ColumnForm.scss';


export const ColumnForm = ({ currentColumns, ...props }) => {
  const colToArr = col =>
    [
      {
        type: 'text',
        label: I18n.metadata_manage.column_tab.name,
        name: `display-name-${col.id}`,
        ...props
      },
      {
        type: 'text',
        label: I18n.metadata_manage.column_tab.description,
        name: `description-${col.id}`,
        ...props
      },
      {
        type: 'text',
        label: I18n.metadata_manage.column_tab.field_name,
        name: `field-name-${col.id}`,
        ...props
      }
    ];

  const arrToFields = arr =>
    arr.map((obj, idx) => <MetadataField {...obj} key={idx} />);

  const fieldsToRows = (fields, idx) =>
    <div className={styles.row} key={idx}>{fields}</div>;

  const rows = currentColumns
    .map(colToArr)
    .map(arrToFields)
    .map(fieldsToRows);

  return (
    <form>
      <Fieldset
        title={I18n.metadata_manage.column_tab.title}
        subtitle={I18n.metadata_manage.column_tab.subtitle}>
        {rows}
      </Fieldset>
    </form>
  );
};

ColumnForm.propTypes = {
  currentColumns: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequred
  }))
};

const getCurrentColumns = db => {
  const currentSchema = Selectors.latestOutputSchema(db);

  return currentSchema
      ? Selectors.columnsForOutputSchema(db, currentSchema.id)
      : [];
};

const createInitialModal = currentColumns => {
  return currentColumns.reduce((acc, col) => {
    acc[`display-name-${col.id}`] = col.display_name;
    acc[`description-${col.id}`] = col.description || '';
    acc[`field-name-${col.id}`] = col.field_name;
    return acc;
  }, {});
};

// We need info from the store to create the validation rules, so instead of
// creating it directly and passing it into validateSchema, we create it within
// mapStateToProps and then pass it into validateSchema HOC as a prop
const isValidFieldName = fieldName => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName);

const createValidationSchema = currentColumns => {
  return currentColumns.reduce((acc, col) => {
    acc[`display-name-${col.id}`] = {
      required: true
    };

    acc[`field-name-${col.id}`] = {
      required: true,
      test: val => {
        if (val && isValidFieldName(val)) {
          return null;
        } else {
          return I18n.edit_metadata.validation_error_fieldname;
        }
      }
    };

    return acc;
  }, {});
};

const mapDispatchToProps = (dispatch) => ({
  syncToStore: (id, key, val) => dispatch(edit('views', { id, [`colForm${_.upperFirst(key)}`]: val }))
});

const mapStateToProps = ({ db, fourfour }) => {
  const currentColumns = getCurrentColumns(db);

  return {
    currentColumns,
    initialModel: createInitialModal(currentColumns),
    validationRules: createValidationSchema(currentColumns),
    fourfour
  };
};

const formWrapper = _.flowRight([
  connect(mapStateToProps, mapDispatchToProps),
  reformed,
  validateSchema()
]);

export default formWrapper(ColumnForm);
