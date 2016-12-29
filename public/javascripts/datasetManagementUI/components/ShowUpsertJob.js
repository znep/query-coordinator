import _ from 'lodash';
import React, { PropTypes } from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { Modal, ModalHeader, ModalContent, ModalFooter } from 'socrata-components';
import * as Links from '../links';

function query(db, upsertJobId) {
  const upsertJob = _.find(db.upsert_jobs, { id: upsertJobId });
  return {
    upsertJob
  };
}

function ShowUpsertJob({ upsertJob, onDismiss }) {
  function goToDataPage() {
    console.log(upsertJob);
    console.log("Going to show schema!");
  }

  const modalProps = {
    fullScreen: true,
    onDismiss: goToDataPage
  };
  const headerProps = {
    title: (
      <span>
        <Link to={Links.uploads}>{I18n.home_pane.data}</Link> &gt;&nbsp;
        {/* TODO: Internationalize! */}
        Upsert Jobs
      </span>
    ),
    onDismiss: onDismiss
  };

  return (
    <div className="show-upsert-job">
      <Modal {...modalProps}>
        <ModalHeader {...headerProps} />

        <ModalContent>
          <p>Job:</p>
          <pre>{JSON.stringify(upsertJob, null, 4)}</pre>
        </ModalContent>
        <ModalFooter>
          <div className="modal-footer-actions">
            <button id="done" className="btn btn-primary" onClick={onDismiss}>
              Done {/* TODO: Internationalize! */}
            </button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
}

ShowUpsertJob.propTypes = {
  upsertJob: PropTypes.object.isRequired,
  onDismiss: PropTypes.func.isRequired
};

function mapStateToProps(state, ownProps) {
  const params = ownProps.params;
  return query(state.db, _.toNumber(params.upsertJobId));
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    onDismiss: () => {
      dispatch(push(Links.home(ownProps.location)));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowUpsertJob);
