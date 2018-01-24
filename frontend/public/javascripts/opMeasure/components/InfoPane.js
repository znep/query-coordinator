import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import * as ViewRights from '../../common/view_rights';
import InfoPaneComponent from '../../common/components/InfoPaneComponent';
import { ModeStates } from '../lib/constants';

// This component wraps a common implementation, passing through a configuration
// based on app state.

export function mapStateToProps(state) {
  const navigateToEdit = () => {
    const path = window.location.pathname.replace(/\/?$/, '');
    window.location.assign(`${path}/edit`);
  };

  const renderEditButton = () => {
    const canEdit = _.intersection(
      ViewRights.mutation_rights,
      state.view.coreView.rights
    ).length > 0;

    if (state.view.mode === ModeStates.VIEW && canEdit) {
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
