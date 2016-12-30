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

// This whole mess needs to not only be internationalized, but also, you know, have actual
// non-placeholder text written.
function statusText(status) {
  switch (status) {
    case 'successful':
      return {
        title: 'Import Succeeded!',
        body: 'You did it!  Congratulations!'
      };
    case 'failure':
      return {
        title: 'Import Failed!',
        body: "I'm sorry Dave, I can't let you do that."
      };
    default:
      return {
        title: 'Finalizing Import!',
        body: 'You are good for now.  Feel free to close down this situation and have some coffee.' +
              "We'll keep going behind the scenes, and your data will be good to go in a bit."
      };
  }
}

/* TODO: Internationalize!  Also, come up with a failure case!*/
function showButton(status, onDismiss) {
  switch (status) {
    case 'successful':
      return (
        <button id="done" className="btn btn-primary" onClick={onDismiss}>
          Done
        </button>
      );
    case 'failed':
      return (
        <button id="done" className="btn btn-error" disabled="true" >
          Failed
        </button>
      );
    default:
      return (
        <button id="done" className="btn btn-primary" disabled="true">
          <span className="spinner-default spinner-btn-primary" />
        </button>
      );
  }
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
        Finalizing Import
      </span>
    ),
    onDismiss: onDismiss
  };

  const { title, body } = statusText(upsertJob.status);

  return (
    <div id="show-upsert-job">
      <Modal {...modalProps}>
        <ModalHeader {...headerProps} />

        <ModalContent>
          <div>
            <h2>{title}</h2>
            <p>{body}</p>
          </div>
        </ModalContent>

        <ModalFooter>{showButton(upsertJob.status, onDismiss)}</ModalFooter>
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
