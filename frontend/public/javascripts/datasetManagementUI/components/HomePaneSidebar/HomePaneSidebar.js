import React, { Component } from 'react';
import RecentActions from 'containers/RecentActionsContainer';

export default function HomePaneSidebar() {
  return (
    <div className="sidebar">
      <div className="header-cont">
        <h2>{I18n.home_pane.home_pane_sidebar.recent_actions}</h2>
      </div>
      <RecentActions />
    </div>
  );
}
