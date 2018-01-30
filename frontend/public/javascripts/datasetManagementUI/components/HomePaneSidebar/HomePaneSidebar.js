import React from 'react';
import RecentActions from 'datasetManagementUI/containers/RecentActionsContainer';
import PropTypes from 'prop-types';

export default function HomePaneSidebar({ toggleRecentActions }) {
  return (
    <div className="home-pane-sidebar recent-actions-container">
      <div className="header-cont">
        <h2>{I18n.home_pane.home_pane_sidebar.recent_actions}</h2>
        <button className="btn btn-transparent dismiss" onClick={toggleRecentActions}>
          <span className="socrata-icon-close-2" />
        </button>
      </div>
      <RecentActions />
    </div>
  );
}

HomePaneSidebar.propTypes = {
  toggleRecentActions: PropTypes.func.isRequired
};
