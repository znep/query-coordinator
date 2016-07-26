import React, { PropTypes } from 'react';
import * as SharedTypes from '../sharedTypes';
import * as UploadFile from './uploadFile';
import * as DownloadFile from './downloadFile';
import * as ColumnDetail from './importColumns/columnDetail';
import SampleRow from './importColumns/sampleRow';
import UpdateHeadersButton from './importColumns/updateHeadersButton';
import * as Utils from '../utils';
import NavigationControl from './navigationControl';

/*
   - Blueprint: schema (names & types)
   - Translation: mapping of file columns to dataset columns
   - Transform: encompasses them both
 */

type ColumnTransform
  = { type: 'title' }
  | { type: 'upper' }
  | { type: 'lower' }
  | { type: 'toStateCode' }
  | { type: 'findReplace', findText: string, replaceText: string, regex: boolean, caseSensitive: boolean }

type ResultColumn = {
  columnSource: ColumnSource,
  name: String,
  chosenType: SharedTypes.TypeName,
  transforms: Array<ColumnTransform>
}

export type ColumnSource
  = { type: 'SingleColumn', sourceColumn: SharedTypes.SourceColumn }
  | { type: 'CompositeColumn', components: Array<string | SharedTypes.SourceColumn> }
  // TODO: location column

type Transform = {
  columns: Array<ResultColumn>,
  numHeaders: number,
  sample: Array<Array<string>>
}


export function initialTransform(summary: UploadFile.Summary): Transform {
  // TODO: set aside location columns
  return summary.columns.map((column) => (
    {
      columnSource: { type: 'SingleColumn', sourceColumn: column },
      name: column.name,
      chosenType: column.suggestion,
      transforms: []
    }
  ));
}

export const CHANGE_HEADER_COUNT = 'CHANGE_HEADER_COUNT';
function changeHeaderCount(change) {
  return {
    type: CHANGE_HEADER_COUNT,
    change
  };
}

export const UPDATE_COLUMN = 'UPDATE_COLUMN';
function updateColumn(index, action) {
  return {
    type: UPDATE_COLUMN,
    index: index,
    action: action
  };
}

export const REMOVE_COLUMN = 'REMOVE_COLUMN';
function removeColumn(index) {
  return {
    type: REMOVE_COLUMN,
    index: index
  };
}

export function update(transform: Transform = null, action): Transform {
  switch (action.type) {
    // this is gross because it falls through
    case DownloadFile.FILE_DOWNLOAD_COMPLETE:
    case UploadFile.FILE_UPLOAD_COMPLETE:
      if (!_.isUndefined(action.summary.columns)) {
        const columns = initialTransform(action.summary);
        return {
          columns: columns,
          defaultColumns: columns,
          numHeaders: action.summary.headers,
          sample: action.summary.sample
        };
      } else {
        return transform;
      }
    case CHANGE_HEADER_COUNT:
      return {
        ...transform,
        numHeaders: transform.numHeaders + action.change
      };
    case UPDATE_COLUMN:
      return {
        ...transform,
        columns: Utils.updateAt(transform.columns, action.index, (col) => ColumnDetail.update(col, action.action))
      };
    case REMOVE_COLUMN:
      return {
        ...transform,
        columns: _.filter(transform.columns, (unused, idx) => idx !== action.index)
      };
    case RESTORE_SUGGESTED_SETTINGS:
      return {
        ...transform,
        columns: transform.defaultColumns
      };
    default:
      return transform;
  }
}


const NUM_PREVIEW_ROWS = 5;
const I18nPrefixed = I18n.screens.dataset_new.import_columns;


export function view({ transform, fileName, sourceColumns, dispatch, goToPage, goToPrevious }) {
  return (
    <div>
      <div className="importColumnsPane columnsPane">
        <div className="importErrorHelpText">
          <p>{/* raw t('screens.dataset_new.import_help', { :common_errors => common_errors_support_link }) */}</p>
        </div>
        <p className="headline">{I18nPrefixed.headline_interpolate.format(fileName)}</p>
        <h2>{I18nPrefixed.subheadline}</h2>
        <ViewColumns columns={transform.columns} dispatch={dispatch} sourceColumns={sourceColumns} />
        <ViewToolbar dispatch={dispatch} />

        <hr />

        <ViewPreview sample={transform.sample} numHeaderRows={transform.numHeaders} dispatch={dispatch} />

        <div className="warningsSection">
          <h2>{I18nPrefixed.errors_warnings}</h2>
          <p className="warningsHelpMessage">{/* t("#{prefix}.help_message", :common_errors => common_errors_support_link ) */}</p>
          <ul className="columnWarningsList"></ul>
        </div>
        <hr />
      </div>
      <NavigationControl
        onNext={() => goToPage('Metadata')}
        onPrev={goToPrevious}
        cancelLink="/profile" />
    </div>
  );
}

view.propTypes = {
  transform: PropTypes.object.isRequired,
  fileName: PropTypes.string.isRequired,
  sourceColumns: PropTypes.arrayOf(PropTypes.object).isRequired,
  dispatch: PropTypes.func.isRequired,
  goToPage: PropTypes.func.isRequired,
  goToPrevious: PropTypes.func.isRequired
};


export const EMPTY_COMPOSITE_COLUMN = { type: 'CompositeColumn', components: [] };

function ViewColumns({columns, dispatch, sourceColumns}) {
  const sourceOptions = [
    ...sourceColumns.map((column) => ({
      type: 'SingleColumn',
      sourceColumn: column
    })),
    EMPTY_COMPOSITE_COLUMN
  ];

  return (
    <div>
      <div className="columnsListHeader importListHeader clearfix">
        <div className="columnHandleCell importHandleCell"></div>
        <div className="columnNameCell">{I18nPrefixed.name}</div>
        <div className="columnTypeCell">{I18nPrefixed.data_type}</div>
        <div className="columnSourceCell">
          {I18nPrefixed.source_column}
          <a href="#" className="alert importTypesMessageLink">
            <span className="icon"></span>
            {I18nPrefixed.why_choose_now}
          </a>
        </div>
      </div>
      <ul className="columnsList importList" >
        {
          columns.map((resultColumn, idx) => {
            function dispatchUpdateColumn(action) {
              return dispatch(updateColumn(idx, action));
            }

            function dispatchRemoveColumn(event) {
              event.preventDefault();
              return dispatch(removeColumn(idx));
            }
            return (
              <ColumnDetail.view
                key={idx}
                resultColumn={resultColumn}
                sourceOptions={sourceOptions}
                dispatchUpdate={dispatchUpdateColumn}
                dispatchRemove={dispatchRemoveColumn} />
            );
          })
       }
      </ul>
    </div>
  );
}

ViewColumns.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  sourceColumns: PropTypes.arrayOf(PropTypes.object).isRequired,
  dispatch: PropTypes.func.isRequired
};

ViewToolbar.propTypes = {
  dispatch: PropTypes.func.isRequired
};

export const RESTORE_SUGGESTED_SETTINGS = 'RESTORE_SUGGESTED_SETTINGS';
export function restoreSuggestedSettings() {
  return { type: RESTORE_SUGGESTED_SETTINGS };
}

// TODO actually hook up buttons
function ViewToolbar({dispatch}) {
  return (
    <div className="columnsToolbar clearfix">
      <div className="presets">
        <a
          className="columnsPresetsButton button"
          href="#set"
          onClick={event => dispatch(restoreSuggestedSettings(event))}>
          {I18nPrefixed.restore_suggested_settings}
        </a>
      </div>
      <div className="actions">
        <a className="clearColumnsButton button" href="#clear">{I18nPrefixed.clear_all}</a>
        <a className="addColumnButton add button" href="#add">
          <span className="icon"></span>
          {I18nPrefixed.add_new_column}
        </a>
      </div>
    </div>
  );
}


function ViewPreview({sample, numHeaderRows, dispatch}) {
  return (
    <div>
      <h2>{I18nPrefixed.headers}</h2>
      <p className="instructions">{I18nPrefixed.headers_instructions}</p>
      <div className="headersTableWrapper">
        <table className="headersTable">
          <tbody>
            {
              _.take(sample, NUM_PREVIEW_ROWS).map((row, idx) => (
                <SampleRow
                  key={idx}
                  isHeader={idx <= numHeaderRows}
                  row={row} />
              ))
            }
          </tbody>
        </table>
      </div>
      <div className="headersActions clearfix">
        <span className="headersCount"></span>
        <UpdateHeadersButton
          buttonType="more"
          onUpdateHeadersCount={(diff) => dispatch(changeHeaderCount(diff))} />
        <UpdateHeadersButton
          buttonType="less"
          onUpdateHeadersCount={(diff) => dispatch(changeHeaderCount(diff))} />
      </div>
    </div>
  );
}

ViewPreview.propTypes = {
  sample: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  numHeaderRows: PropTypes.number.isRequired,
  dispatch: PropTypes.func.isRequired
};
