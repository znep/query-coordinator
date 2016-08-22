import React, { PropTypes } from 'react';
import { combineReducers } from 'redux';

import * as SharedTypes from '../../sharedTypes';

export type LocationSource
  = {
      isMultiple: Boolean,
      street: String,
      singleSource: String,
      city: ColumnOrText,
      state: ColumnOrText,
      zip: ColumnOrText,
      lat: SharedTypes.SourceColumn,
      lon: SharedTypes.SourceColumn
    }

export const update =
  combineReducers({
    isMultiple: updateIsMultipleReducer,
    street: updateColumnForField('street'),
    singleSource: updateColumnForField('singleSource'),
    city: updateColumnOrTextForField('city'),
    state: updateColumnOrTextForField('state'),
    zip: updateColumnOrTextForField('zip'),
    lat: updateColumnForField('lat'),
    lon: updateColumnForField('lon')
  });

// action creators

const UPDATE_MULTIPLE = 'UPDATE_MULTIPLE';
export function updateMultiple(newMultiple) {
  return {
    type: UPDATE_MULTIPLE,
    newMultiple: newMultiple
  };
}

const UPDATE_SOURCE_COLUMN_SINGLE = 'UPDATE_SOURCE_COLUMN_SINGLE';
export function updateSourceColumnSingle(field, newColumn, sourceColumns) {
  return {
    type: UPDATE_SOURCE_COLUMN_SINGLE,
    field: field,
    newColumn: newColumn,
    sourceColumns: sourceColumns
  };
}

const UPDATE_SOURCE_COLUMN = 'UPDATE_SOURCE_COLUMN';
export function updateSourceColumn(field, newColumn, sourceColumns) {
  return {
    type: UPDATE_SOURCE_COLUMN,
    field: field,
    newColumn: newColumn,
    newIsColumn: true,
    sourceColumns: sourceColumns
  };
}

const UPDATE_TEXT = 'UPDATE_TEXT';
export function updateText(field, newText) {
  return {
    type: UPDATE_TEXT,
    field: field,
    newIsColumn: false,
    newText: newText
  };
}

const UPDATE_IS_COLUMN = 'UPDATE_IS_COLUMN';
export function updateIsColumn(field, newIsColumn) {
  return {
    type: UPDATE_TEXT,
    field: field,
    newIsColumn: newIsColumn
  };
}

export function defaultLocationColumn() {
  return {
    type: 'MultipleCols',
    isMultiple: true,
    singleSource: '',
    street: '',
    city: defaultColumnOrText(),
    state: defaultColumnOrText(),
    zip: defaultColumnOrText(),
    lat: '',
    lon: ''
  };
}

export function defaultColumnOrText() {
  return {
    column: '',
    text: '',
    isColumn: true
  };
}

type ColumnOrText = {
  column: String | SharedTypes.SourceColumn,
  text: String,
  isColumn: boolean
}

export function updateIsMultipleReducer(multiple = true, action) {
  switch (action.type) {
    case UPDATE_MULTIPLE:
      return action.newMultiple;
    default:
      return multiple;
  }
}

export function updateColumnReducer(column = '', action) {
  switch (action.type) {
    case UPDATE_SOURCE_COLUMN_SINGLE:
      if (action.newColumn !== '') {
        return action.sourceColumns[action.newColumn];
      } else {
        return action.newColumn;
      }
    default:
      return column;
  }
}

export function updateColumnOrTextReducer(item = defaultColumnOrText(), action) {
  switch (action.type) {
    case UPDATE_IS_COLUMN:
      return {
        ...item,
        column: action.sourceColumns[action.newColumn],
        isColumn: action.newIsColumn
      };
    case UPDATE_SOURCE_COLUMN:
      if (action.newColumn !== '') {
        return {
          ...item,
          column: action.sourceColumns[action.newColumn],
          isColumn: action.newIsColumn
        };
      } else {
        return {
          ...item,
          column: action.newColumn,
          isColumn: action.newIsColumn
        };
      }
    case UPDATE_TEXT:
      return {
        ...item,
        text: action.newText,
        isColumn: action.newIsColumn
      };
    default:
      return item;
  }
}

export function updateColumnForField(fieldName: string) {
  return (item = '', action) => {
    if (action.field === fieldName) {
      return updateColumnReducer(item, action);
    } else {
      return item;
    }
  };
}

export function updateColumnOrTextForField(fieldName: string) {
  return (item = defaultColumnOrText(), action) => {
    if (action.field === fieldName) {
      return updateColumnOrTextReducer(item, action);
    } else {
      return item;
    }
  };
}

function getSpanClassName(isColumn) {
  return isColumn
          ? 'checked'
          : '';
}

export function view({ dispatch, locationColumn, sourceColumns }) {
  sourceColumns = sourceColumns.slice(0, -1);

  return (
    <div className="locationDetails">
      <h3>{I18n.screens.import_common.location_source_col}</h3>
      <h4>{I18n.screens.import_common.addresses_to_geocode}</h4>
      <div className="toggleSection">
        <input
          type="radio"
          name="locationTypeToggle"
          checked={locationColumn.isMultiple}
          onChange={() => dispatch(updateMultiple(true))}
          className="locationTypeToggle multipleColumns" />
        <label className="locationTypeToggleLabel">Import from <strong>multiple columns</strong></label>
      </div>

      <div className="clearfix">
        <fieldset className="left">
          <legend>{I18n.screens.import_common.existing_cols}</legend>

          <div className="line locationAddressLine clearfix">
            <label className="locationAddressLabel" htmlFor="locationAddressColumn">{I18n.screens.import_common.street}</label>
            <div className="selector uniform">
              <span>
                <select
                  onChange={(evt) => dispatch(updateSourceColumnSingle('street', evt.target.value, sourceColumns))}>
                  <option value="">{I18n.screens.import_pane.no_source_column}</option>
                  {sourceColumns.map((obj, idx) => <option value={idx}>{obj.sourceColumn.name}</option>)}
                </select>
              </span>
            </div>
          </div>

          <div className="line locationCityLine clearfix">
            <label className="locationCityLabel" htmlFor="locationCityColumn">{I18n.screens.import_common.city}</label>
            <div className="optionGroup">
              <div className="radio uniform">
                <span className={getSpanClassName(locationColumn.city.isColumn)}>
                  <input
                    type="radio"
                    name="locationCityToggle1"
                    className="locationSourceToggle"
                    checked={locationColumn.city.isColumn}
                    onChange={() => dispatch(updateIsColumn('city', true))} />
                </span>
              </div>
              <div className="selector uniform active">
                <select
                  onChange={(evt) => dispatch(updateSourceColumn('city', evt.target.value, sourceColumns))}>
                  <option value="">{I18n.screens.import_pane.no_source_column}</option>
                  {sourceColumns.map((obj, idx) => <option value={idx}>{obj.sourceColumn.name}</option>)}
                </select>
              </div>
              <div className="radio uniform">
                <span className={getSpanClassName(!locationColumn.city.isColumn)}>
                  <input
                    type="radio"
                    name="locationCityToggle1"
                    className="locationSourceToggle"
                    checked={!locationColumn.city.isColumn}
                    onChange={() => dispatch(updateIsColumn('city', false))} />
                </span>
              </div>
              <input
                type="text"
                className="locationCityStatic textPrompt prompt"
                title="Enter a custom value"
                onChange={(evt) => dispatch(updateText('city', evt.target.value))} />
            </div>
          </div>

          <div className="line locationStateLine clearfix">
            <label className="locationStateLabel" htmlFor="locationStateColumn">{I18n.screens.import_common.state}</label>
            <div className="optionGroup">
              <div className="radio uniform">
                <span className={getSpanClassName(locationColumn.state.isColumn)}>
                  <input
                    type="radio"
                    name="locationStateToggle1"
                    className="locationSourceToggle"
                    checked={locationColumn.state.isColumn}
                    onChange={() => dispatch(updateIsColumn('state', true))} />
                </span>
              </div>
              <div className="selector uniform active">
                <select
                  onChange={(evt) => dispatch(updateSourceColumn('state', evt.target.value, sourceColumns))}>
                  <option value="">{I18n.screens.import_pane.no_source_column}</option>
                  {sourceColumns.map((obj, idx) => <option value={idx}>{obj.sourceColumn.name}</option>)}
                </select>
              </div>
              <div className="radio uniform">
                <span className={getSpanClassName(!locationColumn.state.isColumn)}>
                  <input
                    type="radio"
                    name="locationStateToggle1"
                    className="locationSourceToggle"
                    checked={!locationColumn.state.isColumn}
                    onChange={() => dispatch(updateIsColumn('state', false))} />
                </span>
              </div>
              <input
                type="text"
                className="locationStateStatic textPrompt prompt"
                title="Enter a custom value"
                onChange={(evt) => dispatch(updateText('state', evt.target.value))} />
            </div>
          </div>

          <div className="line locationZipLine clearfix">
            <label className="locationZipLabel" htmlFor="locationZipColumn">{I18n.screens.import_common.zip}</label>
            <div className="optionGroup">
              <div className="radio uniform">
                <span className={getSpanClassName(locationColumn.zip.isColumn)}>
                  <input
                    type="radio"
                    name="locationZipToggle1"
                    className="locationSourceToggle"
                    checked={locationColumn.zip.isColumn}
                    onChange={() => dispatch(updateIsColumn('zip', true))} />
                </span>
              </div>
              <div className="selector uniform active">
                <select
                  onChange={(evt) => dispatch(updateSourceColumn('zip', evt.target.value, sourceColumns))}>
                  <option value="">{I18n.screens.import_pane.no_source_column}</option>
                  {sourceColumns.map((obj, idx) => <option value={idx}>{obj.sourceColumn.name}</option>)}
                </select>
              </div>
              <div className="radio uniform">
                <span className={getSpanClassName(!locationColumn.zip.isColumn)}>
                  <input
                    type="radio"
                    name="locationZipToggle1"
                    className="locationSourceToggle"
                    checked={!locationColumn.zip.isColumn}
                    onChange={() => dispatch(updateIsColumn('zip', false))} />
                </span>
              </div>
              <input
                type="text"
                className="locationZipStatic textPrompt prompt"
                title="Enter a custom value"
                onChange={(evt) => dispatch(updateText('zip', evt.target.value))} />
            </div>
          </div>
        </fieldset>

        <fieldset className="right">
          <legend>{I18n.screens.import_common.existing_latlng_cols}</legend>
          <div className="line locationLatitudeLine clearfix">
            <label className="locationLatitudeLabel">{I18n.screens.import_common.latitude}</label>
            <div className="selector uniform">
              <select
                onChange={(evt) => dispatch(updateSourceColumnSingle('lat', evt.target.value, sourceColumns))}>
                <option value="">{I18n.screens.import_pane.no_source_column}</option>
                {sourceColumns.map((obj, idx) =>
                  <option
                    value={idx}
                    selected={obj.sourceColumn.name === 'Latitude'
                                ? 'selected'
                                : ''}>
                  {obj.sourceColumn.name}</option>)}
              </select>
            </div>
          </div>
          <div className="line locationLongitudeLine clearfix">
            <label className="locationLongitudeLabel">{I18n.screens.import_common.longitude}</label>
            <div className="selector uniform">
              <select
                onChange={(evt) => dispatch(updateSourceColumnSingle('lon', evt.target.value, sourceColumns))}>
                <option value="">{I18n.screens.import_pane.no_source_column}</option>
                {sourceColumns.map((obj, idx) =>
                  <option
                    value={idx}
                    selected={obj.sourceColumn.name === 'Longitude'
                                ? 'selected'
                                : ''}>
                  {obj.sourceColumn.name}</option>)}
              </select>
            </div>
          </div>
        </fieldset>
      </div>

      <div className="toggleSection">
        <div className="radio">
          <span>
            <input
              type="radio"
              name="locationTypeToggle1"
              className="locationTypeToggle singleColumn"
              checked={!locationColumn.isMultiple}
              onChange={() => dispatch(updateMultiple(false))} />
          </span>
          <label className="locationTypeToggleLabel uniform">Import from <strong>single column</strong></label>
        </div>
      </div>

      <div className="importSingleColumnSection">
        <label className="locationSingleColumnLabel">Column</label>
        <div className="selector uniform">
          <select
            onChange={(evt) => dispatch(updateSourceColumnSingle('singleSource', evt.target.value, sourceColumns))}>
            <option value="">(No Source Column)</option>
            {sourceColumns.map((obj, idx) => <option value={idx}>{obj.sourceColumn.name}</option>)}
          </select>
        </div>
        <p>Column must be <a href="http://dev.socrata.com/docs/datatypes/" rel="external">properly formatted</a> prior to import.</p>
      </div>
    </div>
  );
}

view.propTypes = {
  locationColumn: PropTypes.object.isRequired,
  sourceColumns: PropTypes.arrayOf(PropTypes.object).isRequired,
  dispatch: PropTypes.func.isRequired
};
