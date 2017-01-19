import React from 'react';
import { Link } from 'react-router';
import * as Links from '../links';

export default function Update() {
  return (
    <div id="home-pane">
      <section className="management-ui-section">
        <h2>{I18n.home_pane.metadata} <span className="small">{I18n.home_pane.required}</span></h2>
        <div className="alert default manage-section-box">
          {I18n.home_pane.metadata_blurb}
          <Link to={Links.metadata}>
            <button
              className="btn btn-default btn-sm"
              tabIndex="-1">
              {I18n.home_pane.metadata_manage_button}
            </button>
          </Link>
        </div>
      </section>
      <section className="management-ui-section">
        <h2>{I18n.home_pane.data}</h2>
        <div className="alert default manage-section-box">
          {I18n.home_pane.data_blurb}
          <Link to={Links.uploads}>
            <button
              className="btn btn-default btn-sm"
              tabIndex="-1">
              {I18n.home_pane.data_manage_button}
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
