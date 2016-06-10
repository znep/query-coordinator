import React, { PropTypes } from 'react';
import importableTypes from 'importableTypes';


const I18nPrefixed = I18n.screens.dataset_new.column_template;

const view = ({ resultColumn, sourceColumns }) => {
  return (
    <li className="importColumn">
      <div className="mainLine">
        <div className="columnHandleCell importHandleCell"></div>
        <div className="columnNameCell">
          <input type="text" className="columnName" title={I18nPrefixed.name_this_col} value={resultColumn.name} />
        </div>
        <div className="columnTypeCell">
          <select className="columnTypeSelect" value={resultColumn.chosenType}>
            {importableTypes.map(([typeName, humanReadableName]) => (
              <option value={typeName}>{humanReadableName}</option>
            ))}
          </select>
        </div>
        <div className="columnSourceCell">
          <select className="columnTypeSelect" value={resultColumn.sourceColumn.index}>
            {sourceColumns.map((column) => (
              <option value={column.index} key={column.index}>{column.name}</option>
              ))
           }
          </select>
        </div>
        <div className="columnActionCell clearfix">
          <a href="#remove" className="remove icon" title={I18nPrefixed.remove}>{I18nPrefixed.remove}</a>
          <a href="#options" className="options icon" title={I18nPrefixed.options}>{I18nPrefixed.options}</a>
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
};

view.propTypes = {
  resultColumn: PropTypes.object.isRequired,
  sourceColumns: PropTypes.array.isRequired
};

export default view;
