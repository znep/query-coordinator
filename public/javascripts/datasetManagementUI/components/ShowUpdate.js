import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import * as Links from '../links';

function query(db) {
  return {
    upsertJobs: db.upsert_jobs
  };
}

function Update({ upsertJobs }) {
  return (
    <div id="home-pane">
      <section className="management-ui-section">
        <h2>{I18n.home_pane.metadata} <span className="small">{I18n.home_pane.required}</span></h2>
        <div className="alert default manage-section-box">
          {I18n.home_pane.metadata_blurb}
          <Link to={Links.metadata}>
            <button
              className="btn btn-default btn-sm">
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
              className="btn btn-default btn-sm">
              {I18n.home_pane.data_manage_button}
            </button>
          </Link>
        </div>
      </section>
      {upsertJobs.length > 0 ?
        <ShowUpsertJobs upsertJobs={upsertJobs} /> :
        null}
    </div>
  );
}

Update.propTypes = {
  upsertJobs: PropTypes.arrayOf(PropTypes.object)
};

function mapStateToProps(state) {
  return query(state.db);
}

export default connect(mapStateToProps)(Update);


function ShowUpsertJobs({ upsertJobs }) {
  return (
    <section className="management-ui-section">
      <h2>Upsert Jobs</h2>
      <div className="alert default manage-section-box">
        <ul>
          {upsertJobs.map((upsertJob) => (
            <li key={`${upsertJob.schema_id}-${upsertJob.id}`}>
              <Link to={Links.showUpsertJob(upsertJob.id)}>Job {upsertJob.id}</Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

ShowUpsertJobs.propTypes = {
  upsertJobs: PropTypes.arrayOf(PropTypes.object)
};
