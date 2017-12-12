import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Fieldset from 'components/Fieldset/Fieldset';
import Field from 'components/Field/FieldNew';
import WithFlash from 'containers/WithFlashContainer';
import _ from 'lodash';
// import ColumnField from 'containers/ColumnFieldContainer';
import { hasValue } from 'containers/ManageMetadataContainer';
import styles from './ColumnForm.scss';

// makeFieldsFromColumn :: OutputColumn -> Array Field
function makeFieldsFromColumn(oc) {
  return [
    {
      name: 'display_name',
      label: I18n.metadata_manage.column_tab.name,
      elementType: 'text',
      isRequired: true,
      value: oc.display_name,
      validations: [hasValue]
    },
    {
      name: 'description',
      label: I18n.metadata_manage.column_tab.description,
      elementType: 'text',
      isRequired: false,
      value: oc.description,
      validations: []
    },
    {
      name: 'field_name',
      label: I18n.metadata_manage.column_tab.field_name,
      elementType: 'text',
      isRequired: true,
      value: oc.field_name,
      validations: [hasValue]
    }
  ];
}

class ColumnForm extends Component {
  render() {
    const { columns, handleColumnChange } = this.props;

    const sortedColumns = _.orderBy(Object.values(columns), 'position');

    return (
      <WithFlash>
        <form className={styles.form}>
          <Fieldset
            title={I18n.metadata_manage.column_tab.title}
            subtitle={I18n.metadata_manage.column_tab.subtitle}>
            {sortedColumns.map((column, idx) => (
              <div className={styles.row} key={idx}>
                {makeFieldsFromColumn(column).map(field => (
                  <Field
                    field={field}
                    handleChange={e => handleColumnChange(column.id, field.name, e.target.value)} />
                ))}
              </div>
            ))}
          </Fieldset>
        </form>
      </WithFlash>
    );
  }
}

ColumnForm.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
  handleColumnChange: PropTypes.func.isRequired
};

export default ColumnForm;
