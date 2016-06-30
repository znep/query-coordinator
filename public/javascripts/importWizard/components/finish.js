import React, { PropTypes } from 'react';
import NavigationControl from './navigationControl';

export function view({datasetId}) {
  return (
    <div>
      <div className="finishPane">
        <p className="headline">{I18n.screens.dataset_new.finish.headline}</p>
        <p className="subheadline">{I18n.screens.dataset_new.finish.subheadline}</p>
      </div>
      <NavigationControl
        finishLink={`/d/${datasetId}`} />
    </div>
  );
}

view.propTypes = {
  datasetId: PropTypes.string.isRequired
};
