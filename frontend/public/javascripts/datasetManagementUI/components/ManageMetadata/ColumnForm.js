import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import MetadataField from 'components/MetadataField';
import Fieldset from 'components/MetadataFields/Fieldset';
import manageModel from 'components/Forms/manageModel';
import validateSchema from 'components/Forms/validateSchema';
import { edit } from 'actions/database';
import * as Selectors from 'selectors';
import styles from 'styles/ManageMetadata/ColumnForm.scss';

export class ColumnForm extends Component {
  componentWillUpdate(nextProps) {
    const { syncToStore, fourfour, schema, model, isDirty } = this.props;
    const { schema: nextSchema, model: nextModel, isDirty: nextIsDirty } = nextProps;

    if (!_.isEqual(model, nextModel)) {
      syncToStore(fourfour, 'colFormModel', nextModel);
    }

    if (!_.isEqual(isDirty, nextIsDirty)) {
      syncToStore(fourfour, 'colFormIsDirty', nextIsDirty);
    }

    if (!_.isEqual(schema, nextSchema)) {
      syncToStore(fourfour, 'colFormSchema', nextSchema);
    }
  }

  render() {
    // TODO: remove when we upgrade babel-eslint
    // babel-eslint bug: https://github.com/babel/babel-eslint/issues/249
    /* eslint-disable no-use-before-define */
    const { currentColumns, ...rest } = this.props;
    /* eslint-disable no-use-before-define */

    const colToArr = col =>
      [
        {
          type: 'text',
          label: I18n.metadata_manage.column_tab.name,
          name: `display-name-${col.id}`,
          ...rest
        },
        {
          type: 'text',
          label: I18n.metadata_manage.column_tab.description,
          name: `description-${col.id}`,
          ...rest
        },
        {
          type: 'text',
          label: I18n.metadata_manage.column_tab.field_name,
          name: `field-name-${col.id}`,
          ...rest
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
  }
}

ColumnForm.propTypes = {
  currentColumns: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequred
  })),
  syncToStore: PropTypes.func.isRequired,
  fourfour: PropTypes.string.isRequired,
  schema: PropTypes.object,
  isDirty: PropTypes.object,
  model: PropTypes.object
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
  syncToStore: (fourfour, key, val) =>
    dispatch(edit('views', { id: fourfour, [key]: val }))
});

const mapStateToProps = ({ db, routing }) => {
  const currentColumns = getCurrentColumns(db);
  const { fourfour } = routing;

  return {
    currentColumns,
    initialModel: createInitialModal(currentColumns),
    validationRules: createValidationSchema(currentColumns),
    fourfour
  };
};

const formWrapper = _.flowRight([
  connect(mapStateToProps, mapDispatchToProps),
  manageModel,
  validateSchema()
]);

export default formWrapper(ColumnForm);
