import React, { PropTypes } from 'react';
import importableTypes from 'importableTypes';

const I18nPrefixed = I18n.screens.dataset_new.column_template;

const UPDATE_COLUMN_NAME = 'UPDATE_COLUMN_NAME';
function updateColumnName(newName) {
  return {
    type: UPDATE_COLUMN_NAME,
    newName: newName
  };
}

const UPDATE_COLUMN_TYPE = 'UPDATE_COLUMN_TYPE';
function updateColumnType(newType) {
  return {
    type: UPDATE_COLUMN_TYPE,
    newType: newType
  };
}

const UPDATE_SOURCE_COLUMN = 'UPDATE_SOURCE_COLUMN';
function updateSourceColumn(newSourceColumn) {
  return {
    type: UPDATE_SOURCE_COLUMN,
    newSourceColumn: newSourceColumn
  };
}

export function update(column, action) {
  switch (action.type) {
    case UPDATE_COLUMN_NAME:
      return { ...column, name: action.newName };
    case UPDATE_COLUMN_TYPE:
      return { ...column, chosenType: action.newType };
    case UPDATE_SOURCE_COLUMN:
      console.log(column);
      console.log(action.newSourceColumn);
      return { ...column, sourceColumn: action.newSourceColumn };
  }
}

export function view({ resultColumn, sourceColumns, dispatchUpdate, dispatchRemove }) {
  return (
    <li className="importColumn">
      <div className="mainLine">
        <div className="columnHandleCell importHandleCell"></div>
        <div className="columnNameCell">
          <input
            type="text"
            className="columnName"
            title={I18nPrefixed.name_this_col}
            value={resultColumn.name}
            onChange={(event) => dispatchUpdate(updateColumnName(event.target.value))} />
        </div>
        <div className="columnTypeCell">
          <select
            className="columnTypeSelect"
            value={resultColumn.chosenType}
            onChange={(event) => dispatchUpdate(updateColumnType(event.target.value))}>
            {
              importableTypes.map(([typeName, humanReadableName]) => (
                <option value={typeName} key={typeName}>{humanReadableName}</option>
              ))
            }
          </select>
        </div>
        <div className="columnSourceCell">
          <select
            className="columnTypeSelect"
            value={resultColumn.sourceColumn.index}
            onChange={(event) => dispatchUpdate(
                updateSourceColumn(sourceColumns[_.parseInt(event.target.value)]))} >
            {
              sourceColumns.map((column, idx) => (
                <option value={idx} key={idx}>{column.name}</option>
              ))
            }
          </select>
        </div>
        <div className="columnActionCell clearfix">
          <a
            href="#remove"
            className="remove icon"
            title={I18nPrefixed.remove}
            onClick={(event) => dispatchRemove(event)} >{I18nPrefixed.remove}</a>
          <a
            href="#options"
            className="options icon"
            title={I18nPrefixed.options} >{I18nPrefixed.options}</a>
        </div>
      </div>
      {/* TODO: editors go here */}
      <div className="detailsLine">
        <div className="compositeDetails"></div>
        <div className="locationDetails"></div>
        <div className="pointDetails"></div>
        <div className="generalDetails"></div>
      </div>
    </li>
  );
}

view.propTypes = {
  resultColumn: PropTypes.object.isRequired,
  sourceColumns: PropTypes.array.isRequired,
  dispatchUpdate: PropTypes.func.isRequired,
  dispatchRemove: PropTypes.func.isRequired
};
