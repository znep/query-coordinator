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

function statusText(status) {
  switch (status) {
    case 'successful':
      return I18n.show_upsert.successful;
    case 'failure':
      return I18n.show_upsert.failure;
    default:
      return I18n.show_upsert.in_progress;
  }
}

function showButton(status, onDismiss) {
  switch (status) {
    case 'successful':
      return (
        <button id="done" className="btn btn-primary" onClick={onDismiss}>
          {I18n.show_upsert.footer.finished}
        </button>
      );
    case 'failed':
      return (
        <button id="done" className="btn btn-error" disabled="true" >
          {I18n.show_upsert.footer.failed}
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
  const modalProps = {
    fullScreen: true
  };
  const headerProps = {
    title: (
      <span>
        <Link to={Links.uploads}>{I18n.home_pane.data}</Link> &gt;&nbsp;
        {I18n.show_upsert.header.title}
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
