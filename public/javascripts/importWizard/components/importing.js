import React, { PropTypes } from 'react';

export function view({importStatus}) {
  return (
    <div>
      <span>Importing...</span>
      {(() => {
        switch (importStatus.type) {
          case 'InProgress':
            return (
              <div>
                <span>{I18n.screens.import_pane.rows_imported_js.format(importStatus.rowsImported)}</span>
                <a className="button">{I18n.screens.dataset_new.notify_me}</a>
              </div>
            );

          default:
            return null;
        }
      })()}
    </div>
  );
}

view.propTypes = {
  importStatus: PropTypes.object.isRequired
};
