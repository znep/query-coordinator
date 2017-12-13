import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Fieldset from 'components/Fieldset/Fieldset';
import WithFlash from 'containers/WithFlashContainer';
import _ from 'lodash';
import ColumnField from 'containers/ColumnFieldContainer';
import styles from './ColumnForm.scss';

// makeFieldsFromColumn :: OutputColumn -> Array Field
function makeFieldsFromColumn(oc) {
  return [
    {
      name: 'display_name',
      label: I18n.metadata_manage.column_tab.name,
      elementType: 'text',
      isRequired: true,
      value: oc.display_name
    },
    {
      name: 'description',
      label: I18n.metadata_manage.column_tab.description,
      elementType: 'text',
      isRequired: false,
      value: oc.description
    },
    {
      name: 'field_name',
      label: I18n.metadata_manage.column_tab.field_name,
      elementType: 'text',
      isRequired: true,
      value: oc.field_name
    }
  ];
}

class ColumnForm extends Component {
  render() {
    const { columns, handleColumnChange, handleColumnFormSubmit } = this.props;

    const sortedColumns = _.orderBy(Object.values(columns), 'position');

    return (
      <WithFlash>
        <form className={styles.form} onSubmit={handleColumnFormSubmit}>
          <Fieldset
            title={I18n.metadata_manage.column_tab.title}
            subtitle={I18n.metadata_manage.column_tab.subtitle}>
            {sortedColumns.map((column, idx) => (
              <div className={styles.row} key={idx}>
                {makeFieldsFromColumn(column).map(field => (
                  <ColumnField
                    key={`${column.id}-${field.name}`}
                    field={field}
                    columnId={column.id}
                    handleChange={e => handleColumnChange(column.id, field.name, e.target.value)} />
                ))}
              </div>
            ))}
          </Fieldset>
          <input type="submit" id="submit-column-form" className={styles.hidden} />
        </form>
      </WithFlash>
    );
  }
}

ColumnForm.propTypes = {
  columns: PropTypes.object,
  handleColumnChange: PropTypes.func,
  handleColumnFormSubmit: PropTypes.func
};

export default ColumnForm;
