import React, { PropTypes } from 'react';

export function view({ importStatus }) {
  return (
    <div>
      <span>Importing...</span>
      { (() => {
        switch (importStatus.type) {
          case 'InProgress':
            if (importStatus.rowsImported !== null) {
              return (
                <div>
                  <span>{ importStatus.rowsImported } rows imported</span>
                  <a className="button">Notify Me</a>
                  {/* TODO: I18n; make this actually work */}
                </div>
              );
            } else {
              return null;
            }

          default:
            return null;
        }
      })() }
    </div>
  );
}

view.propTypes = {
  importStatus: PropTypes.object.isRequired
};
