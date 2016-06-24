import React, { PropTypes } from 'react';
import NavigationControl from './navigationControl';

function renderProgressText(importStatus, operation) {
  let progressText = null;

  switch (operation) {
    case 'UploadData':
      switch (importStatus.type) {
        case 'InProgress':
          progressText = I18n.screens.import_pane.rows_imported_js.format(importStatus.rowsImported);
          break;
      }
      break;

    case 'UploadGeospatial':
      switch (importStatus.type) {
        case 'InProgress':
          progressText = I18n.screens.import_pane[importStatus.stage];
          break;
      }
      break;

    default:
      console.error('Invalid operation', operation);
  }

  if (progressText !== null) {
    return (
      <p className="importStatus subheadline">
        {progressText}
      </p>
    );
  }
}

export function view({importStatus, operation}) {
  return (
    <div>
      <div className="workingPane">
        <p className="headline">{I18n.screens.dataset_new.importing_your_data}</p>
        {renderProgressText(importStatus, operation)}
        <div className="spinner-default spinner-large-center"></div>
      </div>
      <NavigationControl />
    </div>
  );
}

view.propTypes = {
  importStatus: PropTypes.object.isRequired,
  operation: PropTypes.string.isRequired
};
