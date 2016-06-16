import React, { PropTypes } from 'react';
import * as SharedTypes from '../sharedTypes';
import * as UploadFile from './uploadFile';
import * as ColumnDetail from './importColumns/columnDetail';
import SampleRow from './importColumns/sampleRow';
import UpdateHeadersButton from './importColumns/updateHeadersButton';
import * as Utils from '../utils';

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
  sourceColumn: SharedTypes.SourceColumn,
  name: String,
  chosenType: SharedTypes.TypeName,
  transforms: Array<ColumnTransform>
}

type Transform = {
  columns: Array<ResultColumn>,
  numHeaders: number,
  sample: Array<Array<string>>
}


function initialTransform(summary: UploadFile.Summary): Transform {
  // TODO: set aside location columns
  return summary.columns.map((column) => (
    {
      sourceColumn: column,
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

const UPDATE_COLUMN = 'UPDATE_COLUMN';
function updateColumn(index, action) {
  return {
    type: UPDATE_COLUMN,
    index: index,
    action: action
  };
}

const REMOVE_COLUMN = 'REMOVE_COLUMN';
function removeColumn(index) {
  return {
    type: REMOVE_COLUMN,
    index: index
  };
}

function addColumnIds(summary: UploadFile.Summary): UploadFile.Summary {
  return {
    ...summary,
    columns: summary.columns.map((column, index) => ({...column, index: index}))
  };
}

export function update(transform: Transform = null, action): Transform {
  switch (action.type) {
    case UploadFile.FILE_UPLOAD_COMPLETE:
      if (!_.isUndefined(action.summary.columns)) {
        return {
          columns: initialTransform(addColumnIds(action.summary)),
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
    default:
      return transform;
  }
}


const NUM_PREVIEW_ROWS = 5;
const I18nPrefixed = I18n.screens.dataset_new.import_columns;


export function view({ transform, fileName, dispatch, goToPage }) {
  return (
    <div className="importColumnsPane columnsPane">
      <div className="flash"></div>
      <div className="importErrorHelpText">
        <p>{/* raw t('screens.dataset_new.import_help', { :common_errors => common_errors_support_link }) */}</p>
      </div>
      <p className="headline">{I18nPrefixed.headline_interpolate.format(fileName)}</p>
      <h2>{I18nPrefixed.subheadline}</h2>
      <ViewColumns columns={transform.columns} dispatch={dispatch} />
      <ViewToolbar />

      <hr />

      <ViewPreview sample={transform.sample} numHeaderRows={transform.numHeaders} dispatch={dispatch} />

      <div className="warningsSection">
        <h2>{I18nPrefixed.errors_warnings}</h2>
        <p className="warningsHelpMessage">{/* t("#{prefix}.help_message", :common_errors => common_errors_support_link ) */}</p>
        <ul className="columnWarningsList"></ul>
      </div>
      <hr />
      <a className="button nextButton" onClick={() => goToPage('Metadata')}>
        {I18n.screens.wizard.next}
      </a>
    </div>
  );
}

view.propTypes = {
  transform: PropTypes.object.isRequired,
  fileName: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
  goToPage: PropTypes.func.isRequired
};

function ViewColumns({columns, dispatch}) {
  const sourceColumns = columns.map(c => c.sourceColumn);

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
                sourceColumns={sourceColumns}
                dispatchUpdate={dispatchUpdateColumn}
                dispatchRemove={dispatchRemoveColumn} />
            );
          })
       }
       {/* TODO: ^^ hook up to model */}
      </ul>
    </div>
  );
}

ViewColumns.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  dispatch: PropTypes.func.isRequired
};


// TODO actually hook up buttons
function ViewToolbar() {
  return (
    <div className="columnsToolbar clearfix">
      <div className="presets">
        <label htmlFor="columnsPresetsSelect">{I18nPrefixed.reset_to_preset}:</label>
        <select className="columnsPresetsSelect">
          <option value="suggested">{I18nPrefixed.suggested_columns}</option>
          <option value="suggestedFlat">{I18nPrefixed.suggested_flat}</option>
          <option value="suggestedPlusDiscrete">{I18nPrefixed.suggested_plus_discrete}</option>
          <option value="alltext">{I18nPrefixed.suggested_alltext}</option>
        </select>
        <a className="columnsPresetsButton button" href="#set">{I18nPrefixed.set}</a>
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
            {_.take(sample, NUM_PREVIEW_ROWS).map((row, idx) => (
              <SampleRow
                key={idx}
                isHeader={idx <= numHeaderRows}
                row={row} />
            ))}
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
