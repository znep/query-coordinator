import React, { PropTypes } from 'react';
import { combineReducers } from 'redux';
import format from 'stringformat';

import * as SharedTypes from '../../sharedTypes';

export type LocationSource = {
  isMultiple: Boolean,
  singleSource: ?SharedTypes.SourceColumn,
  street: ?SharedTypes.SourceColumn,
  city: ColumnOrText,
  state: ColumnOrText,
  zip: ColumnOrText,
  latitude: ?SharedTypes.SourceColumn,
  longitude: ?SharedTypes.SourceColumn
}

export function emptyLocationSource() {
  return {
    isMultiple: true,
    singleSource: null,
    street: null,
    city: defaultColumnOrText(),
    state: defaultColumnOrText(),
    zip: defaultColumnOrText(),
    latitude: null,
    longitude: null
  };
}

export const update: (locationSource: LocationSource, action: Object) => LocationSource =
  combineReducers({
    isMultiple: updateIsMultiple,
    singleSource: updateColumnForField('singleSource'),
    street: updateColumnForField('street'),
    city: updateColumnOrTextForField('city'),
    state: updateColumnOrTextForField('state'),
    zip: updateColumnOrTextForField('zip'),
    latitude: updateColumnForField('latitude'),
    longitude: updateColumnForField('longitude')
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
    sourceColumns: sourceColumns
  };
}

const UPDATE_TEXT = 'UPDATE_TEXT';
export function updateText(field, newText) {
  return {
    type: UPDATE_TEXT,
    field: field,
    newText: newText
  };
}

const UPDATE_IS_COLUMN = 'UPDATE_IS_COLUMN';
export function updateIsColumn(field, newIsColumn) {
  return {
    type: UPDATE_IS_COLUMN,
    field: field,
    newIsColumn: newIsColumn
  };
}

export type ColumnOrText = {
  isColumn: boolean,
  column: ?SharedTypes.SourceColumn,
  text: String
}

export function defaultColumnOrText(column: ?SharedTypes.SourceColumn = null) {
  return {
    column: column,
    text: '',
    isColumn: true
  };
}

export function updateIsMultiple(multiple = true, action) {
  switch (action.type) {
    case UPDATE_MULTIPLE:
      return action.newMultiple;
    default:
      return multiple;
  }
}

export function updateColumn(column = null, action) {
  switch (action.type) {
    case UPDATE_SOURCE_COLUMN_SINGLE:
      if (action.newColumn !== null) {
        return action.sourceColumns[action.newColumn];
      } else {
        return action.newColumn;
      }
    default:
      return column;
  }
}

export function updateColumnOrText(item = defaultColumnOrText(), action) {
  switch (action.type) {
    case UPDATE_IS_COLUMN:
      return {
        ...item,
        isColumn: action.newIsColumn
      };
    case UPDATE_SOURCE_COLUMN:
      if (action.newColumn !== null) {
        return {
          ...item,
          column: action.sourceColumns[action.newColumn],
          isColumn: true
        };
      } else {
        return {
          ...item,
          column: action.newColumn,
          isColumn: true
        };
      }
    case UPDATE_TEXT:
      return {
        ...item,
        text: action.newText,
        isColumn: false
      };
    default:
      return item;
  }
}

export function updateColumnForField(fieldName: string) {
  return (item = null, action) => {
    if (action.field === fieldName) {
      return updateColumn(item, action);
    } else {
      return item;
    }
  };
}

export function updateColumnOrTextForField(fieldName: string) {
  return (item = defaultColumnOrText(), action) => {
    if (action.field === fieldName) {
      return updateColumnOrText(item, action);
    } else {
      return item;
    }
  };
}

function getSpanClassName(isColumn) {
  if (isColumn) {
    return 'checked';
  } else {
    return '';
  }
}

function emptyToNull(selection: string) {
  if (selection.length === 0) {
    return null;
  } else {
    return _.parseInt(selection);
  }
}

export function view({ dispatch, resultColumnId, locationColumn, sourceColumns }) {
  return (
    <div className="locationDetails">
      <h3>{I18n.screens.import_common.location_source_col}</h3>
      <h4>{I18n.screens.import_common.addresses_to_geocode}</h4>
      <div className="toggleSection">
        <input
          type="radio"
          name={'locationTypeToggle' + resultColumnId}
          checked={locationColumn.isMultiple}
          onChange={() => dispatch(updateMultiple(true))}
          className="locationTypeToggle multipleColumns" />
        <label
          className="locationTypeToggleLabel"
          dangerouslySetInnerHTML={{__html: I18n.screens.import_common.import_from_multiple}} />
      </div>

      <div className="clearfix">
        <fieldset className="left">
          <legend>{I18n.screens.import_common.existing_cols}</legend>

          <div className="line locationAddressLine clearfix">
            <label className="locationAddressLabel">
              {I18n.screens.import_common.street}
            </label>
            <div className="optionGroup">
              <span>
                <select
                  value={_.get(locationColumn, 'street.index', '')}
                  onChange={(evt) => dispatch(updateSourceColumnSingle('street', emptyToNull(evt.target.value), sourceColumns))}>
                  <option value="">{I18n.screens.import_pane.no_source_column}</option>
                  {sourceColumns.map((obj, idx) => <option value={idx}>{obj.name}</option>)}
                </select>
              </span>
            </div>
          </div>

          <div className="line locationCityLine clearfix">
            <label className="locationCityLabel">{I18n.screens.import_common.city}</label>
            <div className="optionGroup">
              <span className={getSpanClassName(locationColumn.city.isColumn)}>
                <input
                  type="radio"
                  name={'locationCityToggle' + resultColumnId}
                  className="locationSourceToggle"
                  checked={locationColumn.city.isColumn}
                  onChange={() => dispatch(updateIsColumn('city', true))} />
              </span>
              <select
                value={_.get(locationColumn, 'city.column.index', '')}
                onChange={(evt) => dispatch(updateSourceColumn('city', emptyToNull(evt.target.value), sourceColumns))}>
                <option value="">{I18n.screens.import_pane.no_source_column}</option>
                {sourceColumns.map((obj, idx) => <option value={idx}>{obj.name}</option>)}
              </select>
              <span className={getSpanClassName(!locationColumn.city.isColumn)}>
                <input
                  type="radio"
                  name={'locationCityToggle' + resultColumnId}
                  className="locationSourceToggle"
                  checked={!locationColumn.city.isColumn}
                  onChange={() => dispatch(updateIsColumn('city', false))} />
              </span>
              <input
                type="text"
                className="locationCityStatic textPrompt"
                title={I18n.screens.import_common.enter_custom}
                placeholder={I18n.screens.import_common.enter_custom}
                defaultValue={locationColumn.city.text}
                onFocus={() => dispatch(updateIsColumn('city', false))}
                onBlur={(evt) => dispatch(updateText('city', evt.target.value))} />
            </div>
          </div>

          <div className="line locationStateLine clearfix">
            <label className="locationStateLabel">{I18n.screens.import_common.state}</label>
            <div className="optionGroup">
              <span className={getSpanClassName(locationColumn.state.isColumn)}>
                <input
                  type="radio"
                  name={'locationStateToggle' + resultColumnId}
                  className="locationSourceToggle"
                  checked={locationColumn.state.isColumn}
                  onChange={() => dispatch(updateIsColumn('state', true))} />
              </span>
              <select
                value={_.get(locationColumn, 'state.column.index', '')}
                onChange={(evt) => dispatch(updateSourceColumn('state', emptyToNull(evt.target.value), sourceColumns))}>
                <option value="">{I18n.screens.import_pane.no_source_column}</option>
                {sourceColumns.map((obj, idx) => <option value={idx}>{obj.name}</option>)}
              </select>
              <span className={getSpanClassName(!locationColumn.state.isColumn)}>
                <input
                  type="radio"
                  name={'locationStateToggle' + resultColumnId}
                  className="locationSourceToggle"
                  checked={!locationColumn.state.isColumn}
                  onChange={() => dispatch(updateIsColumn('state', false))} />
              </span>
              <input
                type="text"
                className="locationStateStatic textPrompt"
                title={I18n.screens.import_common.enter_custom}
                placeholder={I18n.screens.import_common.enter_custom}
                defaultValue={locationColumn.state.text}
                onFocus={() => dispatch(updateIsColumn('state', false))}
                onBlur={(evt) => dispatch(updateText('state', evt.target.value))} />
            </div>
          </div>

          <div className="line locationZipLine clearfix">
            <label className="locationZipLabel">{I18n.screens.import_common.zip}</label>
            <div className="optionGroup">
              <span className={getSpanClassName(locationColumn.zip.isColumn)}>
                <input
                  type="radio"
                  name={'locationZipToggle' + resultColumnId}
                  className="locationSourceToggle"
                  checked={locationColumn.zip.isColumn}
                  onChange={() => dispatch(updateIsColumn('zip', true))} />
              </span>
              <select
                value={_.get(locationColumn, 'zip.column.index', '')}
                onChange={(evt) => dispatch(updateSourceColumn('zip', emptyToNull(evt.target.value), sourceColumns))}>
                <option value="">{I18n.screens.import_pane.no_source_column}</option>
                {sourceColumns.map((obj, idx) => <option value={idx}>{obj.name}</option>)}
              </select>
              <span className={getSpanClassName(!locationColumn.zip.isColumn)}>
                <input
                  type="radio"
                  name={'locationZipToggle' + resultColumnId}
                  className="locationSourceToggle"
                  checked={!locationColumn.zip.isColumn}
                  onChange={() => dispatch(updateIsColumn('zip', false))} />
              </span>
              <input
                type="text"
                className="locationZipStatic textPrompt"
                title={I18n.screens.import_common.enter_custom}
                placeholder={I18n.screens.import_common.enter_custom}
                defaultValue={locationColumn.zip.text}
                onFocus={() => dispatch(updateIsColumn('zip', false))}
                onBlur={(evt) => dispatch(updateText('zip', evt.target.value))} />
            </div>
          </div>
        </fieldset>

        <fieldset className="right">
          <legend>{I18n.screens.import_common.existing_latlng_cols}</legend>
          <div className="line locationLatitudeLine clearfix">
            <div className="optionGroup">
              <label className="locationLatLonLabel">{I18n.screens.import_common.latitude}</label>
              <select
                value={_.get(locationColumn, 'latitude.index', '')}
                onChange={(evt) => dispatch(updateSourceColumnSingle('latitude', emptyToNull(evt.target.value), sourceColumns))}>
                <option value="">{I18n.screens.import_pane.no_source_column}</option>
                {sourceColumns.map((obj, idx) => <option value={idx}>{obj.name}</option>)}
              </select>
            </div>
          </div>
          <div className="line locationLongitudeLine clearfix">
            <div className="optionGroup">
              <label className="locationLatLonLabel">{I18n.screens.import_common.longitude}</label>
              <select
                value={_.get(locationColumn, 'longitude.index', '')}
                onChange={(evt) => dispatch(updateSourceColumnSingle('longitude', emptyToNull(evt.target.value), sourceColumns))}>
                <option value="">{I18n.screens.import_pane.no_source_column}</option>
                {sourceColumns.map((obj, idx) => <option value={idx}>{obj.name}</option>)}
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
              name={'locationTypeToggle' + resultColumnId}
              className="locationTypeToggle singleColumn"
              checked={!locationColumn.isMultiple}
              onChange={() => dispatch(updateMultiple(false))} />
          </span>
          <label
            className="locationTypeToggleLabel"
            dangerouslySetInnerHTML={{__html: I18n.screens.import_common.import_from_single}} />
        </div>
      </div>

      <div className="importSingleColumnSection">
        <label className="locationSingleColumnLabel">Column</label>
        <select
          value={_.get(locationColumn, 'singleSource.index', '')}
          onChange={(evt) => dispatch(updateSourceColumnSingle('singleSource', emptyToNull(evt.target.value), sourceColumns))}>
          <option value="">{I18n.screens.import_pane.no_source_column}</option>
          {sourceColumns.map((obj, idx) => <option value={idx}>{obj.name}</option>)}
        </select>
        <p
          dangerouslySetInnerHTML={{__html: format(I18n.screens.import_common.properly_formatted, 'http://dev.socrata.com/docs/datatypes/')}} />
      </div>
    </div>
  );
}

view.propTypes = {
  resultColumnId: PropTypes.number.isRequired,
  locationColumn: PropTypes.object.isRequired,
  sourceColumns: PropTypes.arrayOf(PropTypes.object).isRequired,
  dispatch: PropTypes.func.isRequired
};
