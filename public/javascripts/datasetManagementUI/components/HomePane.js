import React from 'react';

export default function HomePane() {
  return (
    <div id="home-pane">
      <section className="management-ui-section">
        <h2>{I18n.home_pane.metadata} <span className="small">{I18n.home_pane.required}</span></h2>
        <div className="alert default manage-section-box">
          {I18n.home_pane.metadata_blurb}
          <button
            className="btn btn-default btn-sm"
            data-modal="manage-metadata-modal">
            {I18n.home_pane.metadata_manage_button}
          </button>
        </div>
      </section>
      <section className="management-ui-section">
        <h2>{I18n.home_pane.data}</h2>
        <div className="alert default manage-section-box">
          {I18n.home_pane.data_blurb}
          <button
            className="btn btn-default btn-sm"
            data-modal="manage-data-modal">
            {I18n.home_pane.data_manage_button}
          </button>
        </div>
      </section>
    </div>
  );
}
