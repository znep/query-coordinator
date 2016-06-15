import React, { PropTypes } from 'react';
import importableTypes from 'importableTypes';

import _ from 'lodash';

const I18nPrefixed = I18n.screens.dataset_new.column_template;
const I18nTransform = I18n.screens.import_common;

// reducers

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

const UPDATE_COLUMN_SHOW_TRANSFORMS = 'UPDATE_COLUMN_SHOW_TRANSFORMS';
function showColumnTransforms(shouldShowTransforms) {
  return {
    type: UPDATE_COLUMN_SHOW_TRANSFORMS,
    showColumnTransforms: shouldShowTransforms
  };
}


export function update(column, action) {
  switch (action.type) {
    case UPDATE_COLUMN_NAME:
      return { ...column, name: action.newName };
    case UPDATE_COLUMN_TYPE:
      return { ...column, chosenType: action.newType };
    case UPDATE_SOURCE_COLUMN:
      return { ...column, sourceColumn: action.newSourceColumn };
    case UPDATE_COLUMN_SHOW_TRANSFORMS:
      return { ...column, showColumnTransforms: action.showColumnTransforms };
  }
}

export function view({ resultColumn, sourceColumns, dispatchUpdate, dispatchRemove }) {

  const isTransformEditorVisible = !_.isUndefined(resultColumn.showColumnTransforms)
    && resultColumn.showColumnTransforms === true;

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
            title={I18nPrefixed.options}
            onClick={() => dispatchUpdate(showColumnTransforms(!isTransformEditorVisible))} >{I18nPrefixed.options}</a>
        </div>
      </div>
      {/* TODO: editors go here */}
      <div className="detailsLine">
        <div className="compositeDetails"></div>
        <div className="locationDetails"></div>
        <div className="pointDetails"></div>
        <div className="generalDetails" style={isTransformEditorVisible ? {display: "block"} : {}}>
          <h3>{I18nTransform.options}</h3>
          <h4>{I18nTransform.transforms}</h4>
          <ul className="columnTransformsList">
            {viewTransformLine()}
          </ul>
          <a href="#newTransform" className="button add newColumnTransformButton">
            <span className="icon"></span>{I18nTransform.new_transform}
          </a>
        </div>
      </div>
    </li>
  );
}

function viewTransformLine() {
  return (
    <li className="clearfix">
      <a className="remove removeTransformLineButton" href="#remove"><span className="icon">{I18nTransform.remove}</span></a>
      <span className="thenText">{I18nTransform.then}</span>
      <select className="columnTransformOperation">
        <option value="title">{I18nTransform.make_title_case}</option>
        <option value="upper">{I18nTransform.make_upper_case}</option>
        <option value="lower">{I18nTransform.make_lower_case}</option>
        <option value="toStateCode">{I18nTransform.to_state_code}</option>
        <option value="findReplace">{I18nTransform.find_and_replace}</option>
      </select>
      <div className="additionalTransformOptions">
        <div className="findReplaceSection">
          <label className="findTextLabel">{I18nTransform.find}</label>
          <input type="text" className="findText"/>
          <label className="replaceTextLabel">{I18nTransform.replace}</label>
          <input type="text" className="replaceText"/>
          <input type="checkbox" className="caseSensitive"/>
          <label className="caseSensitiveLabel">{I18nTransform.case_sensitive}</label>
          <input type="checkbox" className="regex"/>
          <label className="regexLabel">{I18nTransform.regular_expression}</label>
        </div>
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
