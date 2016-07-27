import React, { PropTypes } from 'react';
import _ from 'lodash';

import * as SharedTypes from '../../sharedTypes';
import * as Utils from '../../utils';
import * as ImportColumns from '../importColumns'; // TODO: something other than this cyclical import
import importableTypes from 'importableTypes';

type CompositeComponent = SharedTypes.SourceColumn | string;

// action creators

export const UPDATE_COLUMN_NAME = 'UPDATE_COLUMN_NAME';
export function updateColumnName(newName) {
  return {
    type: UPDATE_COLUMN_NAME,
    newName: newName
  };
}

export const UPDATE_COLUMN_TYPE = 'UPDATE_COLUMN_TYPE';
export function updateColumnType(newType) {
  return {
    type: UPDATE_COLUMN_TYPE,
    newType: newType
  };
}

export const UPDATE_SHOW_TRANSFORMS = 'UPDATE_SHOW_TRANSFORMS';
export function updateShowTransforms(shouldShowTransforms) {
  return {
    type: UPDATE_SHOW_TRANSFORMS,
    showColumnTransforms: shouldShowTransforms
  };
}

export const ADD_TRANSFORM = 'ADD_TRANSFORM';
export function addTransform() {
  return {
    type: ADD_TRANSFORM
  };
}

export const REMOVE_TRANSFORM = 'REMOVE_TRANSFORM';
export function removeTransform(removeIndex) {
  return {
    type: REMOVE_TRANSFORM,
    removeIndex: removeIndex
  };
}

export const UPDATE_TRANSFORM = 'UPDATE_TRANSFORM';
export function updateTransform(changeIndex, newTransform) {
  return {
    type: UPDATE_TRANSFORM,
    changeIndex: changeIndex,
    newTransform: newTransform
  };
}

// === column source stuff

export const SET_COLUMN_SOURCE_SINGLE_COLUMN = 'SET_COLUMN_SOURCE_SINGLE_COLUMN';
export function setColumnSourceSingleColumn(sourceColumn: SharedTypes.SourceColumn) {
  return {
    type: SET_COLUMN_SOURCE_SINGLE_COLUMN,
    sourceColumn
  };
}

export const SET_COLUMN_SOURCE_TO_COMPOSITE = 'SET_COLUMN_SOURCE_TO_COMPOSITE';
export function setColumnSourceToComposite() {
  return {
    type: SET_COLUMN_SOURCE_TO_COMPOSITE
  };
}

// == composite columns

export const UPDATE_COLUMN_SOURCE_COMPOSITE = 'UPDATE_COLUMN_SOURCE_COMPOSITE';
export function updateColumnSourceComposite(action) {
  return {
    type: UPDATE_COLUMN_SOURCE_COMPOSITE,
    action
  };
}

export const ADD_COMPONENT = 'ADD_COMPONENT';
export function addComponent(firstSourceColumn: SharedTypes.SourceColumn) {
  return {
    type: ADD_COMPONENT,
    firstSourceColumn
  };
}

export const UPDATE_COMPONENT = 'UPDATE_COMPONENT';
export function updateComponent(index: number, newValue: string | SharedTypes.SourceColumn) {
  return {
    type: UPDATE_COMPONENT,
    index,
    newValue
  };
}

export const REMOVE_COMPONENT = 'REMOVE_COMPONENT';
export function removeComponent(index: number) {
  return {
    type: REMOVE_COMPONENT,
    index
  };
}

// == TODO: location column actions

const DEFAULT_TRANSFORM = { type: 'title' };

export function update(resultColumn: ImportColumns.ResultColumn, action): ImportColumns.ResultColumn {
  switch (action.type) {
    // basic controls
    case UPDATE_COLUMN_NAME:
      return { ...resultColumn, name: action.newName };

    case UPDATE_COLUMN_TYPE:
      return { ...resultColumn, chosenType: action.newType };

    case SET_COLUMN_SOURCE_SINGLE_COLUMN:
      return {
        ...resultColumn,
        columnSource: { type: 'SingleColumn', sourceColumn: action.sourceColumn }
      };

    case SET_COLUMN_SOURCE_TO_COMPOSITE:
      return {
        ...resultColumn,
        columnSource: { type: 'CompositeColumn', components: [] }
      };

    case UPDATE_COLUMN_SOURCE_COMPOSITE: {
      switch (resultColumn.columnSource.type) {
        case 'CompositeColumn':
          return {
            ...resultColumn,
            columnSource: {
              ...resultColumn.columnSource,
              components: updateCompositeComponents(resultColumn.columnSource.components, action.action)
            }
          };

        // TODO: location columns

        default:
          console.error(`unexpected column source type: ${resultColumn.columnSource.type}`);
          return resultColumn;
      }
    }

    // transforms
    case UPDATE_SHOW_TRANSFORMS:
      return { ...resultColumn, showColumnTransforms: action.showColumnTransforms };

    case ADD_TRANSFORM:
      return { ...resultColumn, transforms: [...resultColumn.transforms, DEFAULT_TRANSFORM] };

    case REMOVE_TRANSFORM:
      return {
        ...resultColumn,
        transforms: Utils.removeAt(resultColumn.transforms, action.removeIndex)
      };

    case UPDATE_TRANSFORM:
      return {
        ...resultColumn,
        transforms: Utils.updateAt(resultColumn.transforms, action.changeIndex, _.constant(action.newTransform))
      };

    default:
      return resultColumn;
  }
}


function updateCompositeComponents(components: Array<CompositeComponent>, action): Array<CompositeComponent> {
  switch (action.type) {
    case ADD_COMPONENT:
      return [...components, action.firstSourceColumn];

    case REMOVE_COMPONENT:
      return Utils.removeAt(components, action.index);

    case UPDATE_COMPONENT:
      return Utils.updateAt(components, action.index, _.constant(action.newValue));

    default:
      return components;
  }
}


function nameAndValueForColumnSource(source: ImportColumns.ColumnSource): { name: string, value: string } {
  return source.type === 'SingleColumn'
    ? { name: source.sourceColumn.name, value: source.sourceColumn.index.toString() }
    : { name: I18n.screens.import_pane.combine_multiple_cols, value: 'composite' };
}


function nameAndValueForCompositeComponent(source: ImportColumns.ColumnSource): { name: string, value: string } {
  return _.isObject(source)
    ? { name: source.name, value: source.index.toString() }
    : { name: I18n.screens.import_common.insert_static_text, value: 'constant' };
}

const I18nPrefixed = I18n.screens.dataset_new.column_template;
const I18nTransform = I18n.screens.import_common;

export function view({ resultColumn, sourceOptions, dispatchUpdate, dispatchRemove }) {
  const isTransformEditorVisible = !_.isUndefined(resultColumn.showColumnTransforms)
    && resultColumn.showColumnTransforms === true;

  function columnSourceAction(option: string): SharedTypes.SourceColumn {
    const parsedIdx = _.parseInt(option);
    return _.isNaN(parsedIdx)
      ? setColumnSourceToComposite()
      : setColumnSourceSingleColumn(sourceOptions[parsedIdx].sourceColumn);
  }

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
            value={nameAndValueForColumnSource(resultColumn.columnSource).value}
            onChange={(event) => dispatchUpdate(columnSourceAction(event.target.value))}>
            {
              sourceOptions.map((sourceOption, idx) => {
                const {name, value} = nameAndValueForColumnSource(sourceOption);
                return <option value={value} key={idx}>{name}</option>;
              })
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
            onClick={() => dispatchUpdate(updateShowTransforms(!isTransformEditorVisible))} >{I18nPrefixed.options}</a>
        </div>
      </div>
      <div className="detailsLine">
        {(() => {
          switch (resultColumn.columnSource.type) {
            case 'CompositeColumn': {
              return (
                <ViewCompositeColumnComponents
                  dispatch={(action) => dispatchUpdate(updateColumnSourceComposite(action))}
                  components={resultColumn.columnSource.components}
                  sourceOptions={sourceOptions} />
              );
            }
            // TODO: location column
            default:
              return null;
          }
        })()}
        {(() => (
          isTransformEditorVisible ?
            <div className="generalDetails">
              <h3>{I18nTransform.options}</h3>
              <h4>{I18nTransform.transforms}</h4>
              <ViewTransforms transforms={resultColumn.transforms} dispatchUpdate={dispatchUpdate} />
              <a
                className="button add newColumnTransformButton"
                onClick={() => dispatchUpdate(addTransform())}>
                <span className="icon"></span>{I18nTransform.new_transform}
              </a>
            </div>
            : null
        ))()}
      </div>
    </li>
  );
}

view.propTypes = {
  resultColumn: PropTypes.object.isRequired,
  sourceOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  dispatchUpdate: PropTypes.func.isRequired,
  dispatchRemove: PropTypes.func.isRequired
};


function ViewCompositeColumnComponents({ components, sourceOptions, dispatch }) {
  const singleColOptions = sourceOptions.
    filter(source => source.type === 'SingleColumn').
    map(source => source.sourceColumn);

  const options = [...singleColOptions, ''];

  function compositeComponentAction(index: number, option: string) {
    const parsedIdx = _.parseInt(option);
    return _.isNaN(parsedIdx)
      ? updateComponent(index, '')
      : updateComponent(index, singleColOptions[parsedIdx]);
  }

  return (
    <div className="compositeDetails">
      <h3>{I18n.screens.import_common.combine_multiple_columns}</h3>
      <h4>{I18n.screens.import_common.create_composite}</h4>
      <ul className="sourceColumnsList">
        {components.map((component, componentIdx) => (
          <li className="clearfix">
            <a
              className="remove removeSourceColumnLineButton"
              onClick={() => dispatch(removeComponent(componentIdx))}>
              <span className="icon">remove</span>
            </a>
            <select
              className="compositeColumnSourceSelect"
              value={nameAndValueForCompositeComponent(component).value}
              onChange={(evt) => dispatch(compositeComponentAction(componentIdx, evt.target.value))}>
              {options.map((option) => {
                // TODO: optimize: these are the same for each instance of this component on the page
                const {name, value} = nameAndValueForCompositeComponent(option);
                return <option value={value}>{name}</option>;
              })}
            </select>
            {_.isString(component) ?
              <input
                type="text"
                className="staticSourceText"
                value={component}
                onChange={(evt) => dispatch(updateComponent(componentIdx, evt.target.value))} />
              : null
            }
          </li>
        ))}
      </ul>
      <a
        className="button add newSourceColumnButton"
        onClick={() => dispatch(addComponent(sourceOptions[0].sourceColumn))}>
        <span className="icon"></span>
        {I18n.screens.import_common.new_source_col}
      </a>
    </div>
  );
}

ViewCompositeColumnComponents.propTypes = {
  components: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired,
  sourceOptions: PropTypes.array.isRequired
};


function ViewTransforms({ transforms, dispatchUpdate }) {
  return (
    <ul className="columnTransformsList">
    {
      transforms.map((transform, idx) => (
        <li className="clearfix" key={idx}>
          <a
            className="remove removeTransformLineButton"
            onClick={() => dispatchUpdate(removeTransform(idx))}>
            <span className="icon">{I18nTransform.remove}</span>
          </a>
          {idx > 0
            ? <span className="thenText">{I18nTransform.then}</span>
            : <span className="thenText" style={{visibility: 'hidden'}}>{I18nTransform.then}</span>
          }
          <select
            className="columnTransformOperation"
            value={transform.type}
            onChange={(event) => dispatchUpdate(updateTransform(idx, {...transform, type: event.target.value}))}>
            <option value="title">{I18nTransform.make_title_case}</option>
            <option value="upper">{I18nTransform.make_upper_case}</option>
            <option value="lower">{I18nTransform.make_lower_case}</option>
            <option value="toStateCode">{I18nTransform.to_state_code}</option>
            <option value="findReplace">{I18nTransform.find_and_replace}</option>
          </select>
          {transform.type === 'findReplace' ?
            <div className="additionalTransformOptions">
              <div className="findReplaceSection" style={{display: 'block'}}>
                <label className="findTextLabel">{I18nTransform.find}</label>
                <input
                  type="text" className="findText" defaultValue={transform.findText}
                  onChange={(event) => dispatchUpdate(updateTransform(idx, {...transform, findText: event.target.value}))} />
                <label className="replaceTextLabel">{I18nTransform.replace}</label>
                <input
                  type="text" className="replaceText" defaultValue={transform.replaceText}
                  onChange={(event) => dispatchUpdate(updateTransform(idx, {...transform, replaceText: event.target.value}))} />
                <input
                  type="checkbox" className="caseSensitive"
                  defaultChecked={transform.caseSensitive}
                  onClick={() => dispatchUpdate(updateTransform(idx, {...transform, caseSensitive: !transform.caseSensitive}))} />
                <label className="caseSensitiveLabel">{I18nTransform.case_sensitive}</label>
                <input
                  type="checkbox" className="regex" defaultChecked={transform.regex}
                  onClick={() => dispatchUpdate(updateTransform(idx, {...transform, regex: !transform.regex}))} />
                <label className="regexLabel">{I18nTransform.regular_expression}</label>
              </div>
            </div>
            : null
        }
        </li>
      ))
    }
    </ul>
  );
}

ViewTransforms.propTypes = {
  transforms: PropTypes.arrayOf(PropTypes.object).isRequired,
  dispatchUpdate: PropTypes.func.isRequired
};
