import React, { PropTypes } from 'react';
import importableTypes from 'importableTypes';

import _ from 'lodash';

const I18nPrefixed = I18n.screens.dataset_new.column_template;
const I18nTransform = I18n.screens.import_common;


function makeColumnTransform() {
  return { type: 'title' };
}

// action dispatchers

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

const UPDATE_COLUMN_ADD_TRANSFORM = 'UPDATE_COLUMN_ADD_TRANSFORM';
function addColumnTransform() {
  return {
    type: UPDATE_COLUMN_ADD_TRANSFORM
  };
}

const UPDATE_COLUMN_REMOVE_TRANSFORM = 'UPDATE_COLUMN_REMOVE_TRANSFORM';
function removeColumnTransform(removeIndex) {
  return {
    type: UPDATE_COLUMN_REMOVE_TRANSFORM,
    removeIndex: removeIndex
  };
}

const UPDATE_COLUMN_CHANGE_TRANSFORM = 'UPDATE_COLUMN_CHANGE_TRANSFORM';
function changeColumnTransform(changeIndex, newTransform) {
  return {
    type: UPDATE_COLUMN_CHANGE_TRANSFORM,
    changeIndex: changeIndex,
    newTransform: newTransform
  };
}

export function update(columnState, action) {
  switch (action.type) {
    case UPDATE_COLUMN_NAME:
      return { ...columnState, name: action.newName };
    case UPDATE_COLUMN_TYPE:
      return { ...columnState, chosenType: action.newType };
    case UPDATE_SOURCE_COLUMN:
      return { ...columnState, sourceColumn: action.newSourceColumn };
    case UPDATE_COLUMN_SHOW_TRANSFORMS:
      return { ...columnState, showColumnTransforms: action.showColumnTransforms };
    case UPDATE_COLUMN_ADD_TRANSFORM: {
      let transforms;
      const newTransform = makeColumnTransform();
      if (!_.isUndefined(columnState.transforms)) {
        transforms = [ ...columnState.transforms, newTransform ];
      } else {
        transforms = [ newTransform ];
      }
      return { ...columnState, transforms: transforms };
    }
    case UPDATE_COLUMN_REMOVE_TRANSFORM: {
      let transforms = [ ...columnState.transforms ];
      transforms.splice(action.removeIndex, 1);
      return { ...columnState, transforms: transforms };
    }
    case UPDATE_COLUMN_CHANGE_TRANSFORM: {
      const newTransforms = [
        ...columnState.transforms.slice(0, action.changeIndex),
        action.newTransform,
        ...columnState.transforms.slice(action.changeIndex + 1)
      ];
      return { ...columnState, transforms: newTransforms };
    }
    default:
      return columnState;
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
        <div className="generalDetails" style={isTransformEditorVisible ? {display: 'block'} : {}}>
          <h3>{I18nTransform.options}</h3>
          <h4>{I18nTransform.transforms}</h4>
          {viewTransforms(resultColumn.transforms, dispatchUpdate)}
          <a
            href="#newTransform" className="button add newColumnTransformButton"
            onClick={() => dispatchUpdate(addColumnTransform())}>
            <span className="icon"></span>{I18nTransform.new_transform}
          </a>
        </div>
      </div>
    </li>
  );
}

function viewTransforms(transforms, dispatchUpdate) {

  return (
    <ul className="columnTransformsList">
    {
      transforms.map((transform, idx) => (
        <li className="clearfix" key={idx}>
          <a
            className="remove removeTransformLineButton" href="#remove"
            onClick={() => dispatchUpdate(removeColumnTransform(idx))}>
            <span className="icon">{I18nTransform.remove}</span>
          </a>
          {(() => {
            if (idx > 0) {
              return <span className="thenText">{I18nTransform.then}</span>;
            } else {
              return <span className="thenText" style={{visibility: 'hidden'}}>{I18nTransform.then}</span>;
            }
          })()}
          <select
            className="columnTransformOperation"
            value={transform.type}
            onChange={(event) => dispatchUpdate(changeColumnTransform(idx, {...transform, type: event.target.value}))}>
            <option value="title">{I18nTransform.make_title_case}</option>
            <option value="upper">{I18nTransform.make_upper_case}</option>
            <option value="lower">{I18nTransform.make_lower_case}</option>
            <option value="toStateCode">{I18nTransform.to_state_code}</option>
            <option value="findReplace">{I18nTransform.find_and_replace}</option>
          </select>
          {(() => {
            if (transform.type === 'findReplace') {
              return (
                <div className="additionalTransformOptions">
                  <div className="findReplaceSection" style={{display: 'block'}}>
                    <label className="findTextLabel">{I18nTransform.find}</label>
                    <input
                      type="text" className="findText" defaultValue={transform.findText}
                      onChange={(event) => dispatchUpdate(changeColumnTransform(idx, {...transform, findText: event.target.value}))} />
                    <label className="replaceTextLabel">{I18nTransform.replace}</label>
                    <input
                      type="text" className="replaceText" defaultValue={transform.replaceText}
                      onChange={(event) => dispatchUpdate(changeColumnTransform(idx, {...transform, replaceText: event.target.value}))} />
                    <input
                      type="checkbox" className="caseSensitive" defaultChecked={transform.caseSensitive}
                      onClick={() => dispatchUpdate(changeColumnTransform(idx, {...transform, caseSensitive: !transform.caseSensitive}))} />
                    <label className="caseSensitiveLabel">{I18nTransform.case_sensitive}</label>
                    <input
                      type="checkbox" className="regex" defaultChecked={transform.regex}
                      onClick={() => dispatchUpdate(changeColumnTransform(idx, {...transform, regex: !transform.regex}))} />
                    <label className="regexLabel">{I18nTransform.regular_expression}</label>
                  </div>
                </div>
              );
            }
          })()}

        </li>
      ))
    }
    </ul>
  );
}

view.propTypes = {
  resultColumn: PropTypes.object.isRequired,
  sourceColumns: PropTypes.array.isRequired,
  dispatchUpdate: PropTypes.func.isRequired,
  dispatchRemove: PropTypes.func.isRequired
};
