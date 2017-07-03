import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import Fieldset from 'components/MetadataFields/Fieldset';
// import * as Selectors from 'selectors';
// import { editView } from 'actions/views';
import { makeRows } from 'models/forms';
import ColumnField from 'components/FormComponents/ColumnField';
import styles from 'styles/ManageMetadata/ColumnForm.scss';

export class ColumnForm extends Component {
  render() {
    const { rows } = this.props;

    return (
      <form>
        <Fieldset
          title={I18n.metadata_manage.column_tab.title}
          subtitle={I18n.metadata_manage.column_tab.subtitle}>
          {rows.map((row, idx) =>
            <div className={styles.row} key={idx}>
              {row.map(field => <ColumnField field={field} key={field.name} />)}
            </div>
          )}
        </Fieldset>
      </form>
    );
  }
}

ColumnForm.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  fourfour: PropTypes.string.isRequired
};

// const isValidFieldName = fieldName => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName);

// const createValidationSchema = currentColumns => {
//   return currentColumns.reduce((acc, col) => {
//     const displayNameValidaions = {
//       [`display-name-${col.id}`]: {
//         required: true,
//         noDupesWith: {
//           fieldFilter: (val, key) => /^display-name/.test(key),
//           message: I18n.edit_metadata.validation_error_dupe_display_name
//         }
//       }
//     };
//
//     const fieldNameValidations = {
//       [`field-name-${col.id}`]: {
//         required: true,
//         noDupesWith: {
//           fieldFilter: (val, key) => /^field-name/.test(key),
//           message: I18n.edit_metadata.validation_error_dupe_field_name
//         },
//         test: val => {
//           if (val && isValidFieldName(val)) {
//             return null;
//           } else {
//             return I18n.edit_metadata.validation_error_fieldname;
//           }
//         }
//       }
//     };
//
//     return {
//       ...acc,
//       ...displayNameValidaions,
//       ...fieldNameValidations
//     };
//   }, {});
// };

// const mapDispatchToProps = dispatch => ({
//   syncToStore: (fourfour, key, val) => dispatch(editView(fourfour, { [key]: val }))
// });

const mapStateToProps = ({ entities, ui }) => {
  const { fourfour } = ui.routing;

  return {
    rows: makeRows(entities),
    fourfour
  };
};

export default connect(mapStateToProps)(ColumnForm);
