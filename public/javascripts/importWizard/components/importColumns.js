import React, { PropTypes } from 'react';
import format from 'stringformat';

import * as ST from '../sharedTypes';
import * as UploadFile from './uploadFile';
import * as DownloadFile from './downloadFile';
import * as ColumnDetail from './importColumns/columnDetail';
import SampleRow from './importColumns/sampleRow';
import UpdateHeadersButton from './importColumns/updateHeadersButton';
import * as Utils from '../utils';
import * as Validation from './importColumns/validation';
import NavigationControl from './navigationControl';

/*
- Blueprint: schema (names & types)
- Translation: mapping of file columns to dataset columns
- Transform: encompasses them both
*/

type ColumnTransform
  = { type: 'upper' }
  | { type: 'lower' }
  | { type: 'toStateCode' }
  | { type: 'findReplace', findText: string, replaceText: string, regex: boolean, caseSensitive: boolean }


export type ResultColumn = {
  id: number,
  columnSource: ColumnSource,
  name: String,
  chosenType: ST.TypeName,
  transforms: Array<ColumnTransform>
}

export type ColumnSource
  = { type: 'SingleColumn', sourceColumn: ST.SourceColumn }
  | { type: 'CompositeColumn', components: Array<string | ST.SourceColumn> }
  // TODO: location column


// TODO: rename to 'Model' or something. Ugh.
type Transform = {
  columns: Translation,
  numHeaders: number,
  sample: Array<Array<string>>
}


type Translation = Array<ResultColumn>


export function initialTranslation(summary: UploadFile.Summary): Translation {
  // TODO: set aside location columns
  return summary.columns.map((column, idx) => (
    {
      columnSource: { type: 'SingleColumn', sourceColumn: column },
      name: column.name,
      chosenType: column.suggestion,
      transforms: [],
      id: idx
    }
  ));
}

// actions

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
        const columns = initialTranslation(action.summary);
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

const commonErrorsSupportLink = 'http://support.socrata.com/entries/23786838-Import-Warning-and-Errors';


export function view({ transform, fileName, sourceColumns, dispatch, goToPage, goToPrevious }) {
  const problems = Validation.validate(transform.columns, sourceColumns);
  const nextAction =
    Validation.emptyOrAllWarnings(problems)
      ? (() => goToPage('Metadata'))
      : null;
  return (
    <div>
      <div className="importColumnsPane columnsPane">
        <div className="importErrorHelpText">
          <p dangerouslySetInnerHTML={{__html: format(I18n.screens.dataset_new.import_help, commonErrorsSupportLink)}}>
          </p>
        </div>
        <p className="headline">{format(I18nPrefixed.headline_interpolate, fileName)}</p>
        <h2>{I18nPrefixed.subheadline}</h2>
        <ViewColumns columns={transform.columns} dispatch={dispatch} sourceColumns={sourceColumns} />
        <ViewToolbar dispatch={dispatch} />

        <hr />

        <ViewPreview sample={transform.sample} numHeaderRows={transform.numHeaders} dispatch={dispatch} />
        <Validation.ViewProblems problems={problems} />

        <hr />
      </div>
      <NavigationControl
        onNext={nextAction}
        onPrev={goToPrevious}
        cancelLink="/profile" />
    </div>
  );
}

view.propTypes = {
  transform: PropTypes.object.isRequired,
  sourceColumns: PropTypes.arrayOf(PropTypes.object).isRequired,
  fileName: PropTypes.string.isRequired,
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
                key={resultColumn.id}
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

ViewToolbar.propTypes = {};


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
