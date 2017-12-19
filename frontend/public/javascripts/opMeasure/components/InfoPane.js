import React from 'react';
import { connect } from 'react-redux';

import I18n from 'common/i18n';

import InfoPaneComponent from '../../common/components/InfoPaneComponent';
import { ModeStates } from '../lib/constants';

// This component wraps a common implementation, passing through a configuration
// based on app state.

function mapStateToProps(state) {
  const navigateToEdit = () => {
    const path = window.location.pathname.replace(/\/?$/, '');
    window.location.assign(`${path}/edit`);
  };

  const renderEditButton = () => {
    if (state.view.mode === ModeStates.VIEW) { // TODO: add rights check here
      return (
        <button type="button" className="btn btn-simple btn-sm btn-edit" onClick={navigateToEdit}>
          {I18n.t('open_performance.edit')}
        </button>
      );
    } else {
      return null;
    }
  };
  
  return { 
    name: state.view.coreView.name,
    description: state.view.coreView.description,
    provenance: null,
    isPaneCollapsible: false,
    renderButtons() {
      return (
        <div className="btn-group">
          {renderEditButton()}
        </div>
      );
    }
  };
}

export default connect(mapStateToProps)(InfoPaneComponent);
