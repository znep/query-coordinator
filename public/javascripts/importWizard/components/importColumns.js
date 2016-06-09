import React, { PropTypes } from 'react';
import * as SharedTypes from '../sharedTypes';
import * as UploadFile from './uploadFile';
import ColumnDetail from './importColumns/columnDetail';
import SampleRow from './importColumns/sampleRow';
import UpdateHeadersButton from './importColumns/updateHeadersButton';

/*
- Blueprint: schema (names & types)
- Translation: mapping of file columns to dataset columns
- Transform: encompasses them both
*/
type Transform = Array<ResultColumn>;


type ResultColumn = {
  sourceColumn: SharedTypes.SourceColumn,
  name: String,
  chosenType: SharedTypes.TypeName,
  transforms: Array<ColumnTransform>,
}


type ColumnTransform
  = { type: 'upper' }
  | { type: 'lower' }
  // TODO: forgetting some
  | { type: 'findReplace', find: string, replace: string, regex: boolean, caseInsensitive: boolean }


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


export const IMPORT_COLUMNS_NEXT = 'IMPORT_COLUMNS_NEXT';
function importColumnsNext() {
  return {
    type: IMPORT_COLUMNS_NEXT
  };
}


export function update(transform: Transform = null, action): Array<ResultColumn> {
  switch (action.type) {
    case UploadFile.FILE_UPLOAD_COMPLETE:
      return initialTransform(action.summary);
    default:
      return transform;
  }
}


const NUM_PREVIEW_ROWS = 5;
const I18nPrefixed = I18n.screens.dataset_new.import_columns;


export function view({ transform, fileName, summary, dispatch }) {
  return (
    <div className="importColumnsPane columnsPane">
      <div className="flash"></div>
      <div className="importErrorHelpText">
        <p>{/* raw t('screens.dataset_new.import_help', { :common_errors => common_errors_support_link }) */}</p>
      </div>
      <p className="headline">{ I18nPrefixed.headline_interpolate.format(fileName) }</p>
      <h2>{ I18nPrefixed.subheadline }</h2>
      <viewColumns transform={ transform } />
      <viewToolbar />

      <hr/>

      <viewPreview sample={ summary.sample } />

      <div className="warningsSection">
        <h2>{ I18nPrefixed.errors_warnings }</h2>
        <p className="warningsHelpMessage">{/* t("#{prefix}.help_message", :common_errors => common_errors_support_link ) */}</p>
        <ul className="columnWarningsList"></ul>
      </div>
      <hr/>
      <a className="button nextButton" onClick={ () => dispatch(importColumnsNext()) }>Next</a>
    </div>
  );
}

view.propTypes = {
  fileName: PropTypes.string.isRequired,
  transform: PropTypes.arrayOf(PropTypes.object).isRequired,
  summary: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};


function viewColumns({ transform, summary }) {
  return (
    <div>
      <div className="columnsListHeader importListHeader clearfix">
        <div className="columnHandleCell importHandleCell"></div>
        <div className="columnNameCell">{ I18nPrefixed.name }</div>
        <div className="columnTypeCell">{ I18nPrefixed.data_type }</div>
        <div className="columnSourceCell">
          { I18nPrefixed.source_column }
          <a href="#" className="alert importTypesMessageLink">
            <span className="icon"></span>
            { I18nPrefixed.why_choose_now }
          </a>
        </div>
      </div>
      <ul className="columnsList importList" >
        { transform.map((resultColumn, idx) => (
            <ColumnDetail resultColumn={ resultColumn }
                          key={ idx }
                          sourceColumns={ summary.columns } />
            )
          )
        }
        {/* TODO: ^^ hook up to model */}
      </ul>
    </div>
  );
}

viewColumns.propTypes = {
  transform: PropTypes.arrayOf(PropTypes.object).isRequired,
  summary: PropTypes.object.isRequired
};


// TODO actually hook up buttons
function viewToolbar() {
  return (
    <div className="columnsToolbar clearfix">
      <div className="presets">
        <label htmlFor="columnsPresetsSelect">{ I18nPrefixed.reset_to_preset }:</label>
        <select className="columnsPresetsSelect">
          <option value="suggested">{ I18nPrefixed.suggested_columns }</option>
          <option value="suggestedFlat">{ I18nPrefixed.suggested_flat }</option>
          <option value="suggestedPlusDiscrete">{ I18nPrefixed.suggested_plus_discrete }</option>
          <option value="alltext">{ I18nPrefixed.suggested_alltext }</option>
        </select>
        <a className="columnsPresetsButton button" href="#set">{ I18nPrefixed.set }</a>
      </div>
      <div className="actions">
        <a className="clearColumnsButton button" href="#clear">{ I18nPrefixed.clear_all }</a>
        <a className="addColumnButton add button" href="#add">
          <span className="icon"></span>
          { I18nPrefixed.add_new_column }
        </a>
      </div>
    </div>
  );
}


function viewPreview({ summary }) {
  return (
    <div>
      <h2>{ I18nPrefixed.headers }</h2>
      <p className="instructions">{ I18nPrefixed.headers_instructions }</p>
      <div className="headersTableWrapper">
        <table className="headersTable">
          <tbody>
            {_.take(summary, NUM_PREVIEW_ROWS).map((row, idx) => (
              <SampleRow
                isHeader={ idx <= summary.headers }
                row={ row } />
            ))}
          </tbody>
        </table>
      </div>
      <div className="headersActions clearfix">
        {/*
        <span className="headersCount"></span>
          <UpdateHeadersButton
            buttonType='more'
            onUpdateHeadersCount={ onUpdateHeadersCount } />
          <UpdateHeadersButton
            buttonType='less'
            onUpdateHeadersCount={ onUpdateHeadersCount } />
        */}
      </div>
    </div>
  );
}

viewPreview.propTypes = {
  summary: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired
};
