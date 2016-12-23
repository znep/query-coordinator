import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

function query(db, upsertJobId) {
  const upsertJob = _.find(db.upsert_jobs, { id: upsertJobId });
  return {
    upsertJob
  };
}

function ShowUpsertJob({ upsertJob }) {
  return (
    <div className="show-upsert-job">
      <p>Job:</p>
      <pre>{JSON.stringify(upsertJob, null, 4)}</pre>
    </div>
  );
}

ShowUpsertJob.propTypes = {
  upsertJob: PropTypes.object.isRequired
};

function mapStateToProps(state, ownProps) {
  const params = ownProps.params;
  return query(state.db, _.toNumber(params.upsertJobId));
}

export default connect(mapStateToProps)(ShowUpsertJob);
