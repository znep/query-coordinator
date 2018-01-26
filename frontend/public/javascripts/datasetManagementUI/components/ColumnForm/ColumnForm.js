import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Fieldset from 'datasetManagementUI/components/Fieldset/Fieldset';
import WithFlash from 'datasetManagementUI/containers/WithFlashContainer';
import _ from 'lodash';
import ColumnField from 'datasetManagementUI/containers/ColumnFieldContainer';

// makeFieldsFromColumn :: OutputColumn -> Array Field
function makeFieldsFromColumn(outputColumn) {
  return [
    {
      name: `${outputColumn.id}-display_name`,
      id: 'display_name',
      label: I18n.metadata_manage.column_tab.name,
      elementType: 'text',
      isRequired: true,
      value: outputColumn.display_name
    },
    {
      name: `${outputColumn.id}-description`,
      id: 'description',
      label: I18n.metadata_manage.column_tab.description,
      elementType: 'text',
      isRequired: false,
      value: outputColumn.description
    },
    {
      name: `${outputColumn.id}-field_name`,
      id: 'field_name',
      label: I18n.metadata_manage.column_tab.field_name,
      elementType: 'text',
      isRequired: true,
      value: outputColumn.field_name
    }
  ];
}

class ColumnForm extends Component {
  render() {
    const { columns, handleColumnChange, handleColumnFormSubmit } = this.props;
    const sortedColumns = _.orderBy(_.values(columns), 'position');

    return (
      <WithFlash>
        <div id="column-form">
          <form className="dsmp-form" onSubmit={handleColumnFormSubmit}>
            <Fieldset
              title={I18n.metadata_manage.column_tab.title}
              subtitle={I18n.metadata_manage.column_tab.subtitle}>
              {sortedColumns.map((column, idx) => (
                <div className="dsmp-row" key={idx}>
                  {makeFieldsFromColumn(column).map(field => (
                    <ColumnField
                      key={`${column.id}-${field.name}`}
                      field={field}
                      columnId={column.id}
                      handleChange={e => handleColumnChange(column.id, field.id, e.target.value)} />
                  ))}
                </div>
              ))}
            </Fieldset>
            <input type="submit" id="submit-column-form" className="dsmp-hidden" value="submit" />
          </form>
        </div>
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
