import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent } from 'socrata-components';
import * as Links from '../links';

function query(db, uploadId) {
  const upload = _.find(db.uploads, { id: _.toNumber(uploadId) });
  const schemas = _.filter(db.schemas, { upload_id: upload.id });
  let latestSchema;

  if (schemas.length) {
    const latestSchemas = _.filter(db.schemas, { input_schema_id: schemas[0].id });
    latestSchema = _.last(latestSchemas);
  }

  return {
    upload,
    latestSchema
  };
}

function ShowUpload({ upload, latestSchema, goToUploads }) {
  let body;
  if (_.isUndefined(latestSchema)) {
    body = (
      <div className="centered-container">
        <span className="spinner-default spinner-large"></span>
      </div>
    );
  } else {
    body = (
      <div>
        Layers:
        <ul>
          <li>
            {latestSchema.name || I18n.home_pane.only_layer}
            <ul>
              <li>
                <Link
                  to={Links.showOutputSchema(upload.id, latestSchema.id, latestSchema.id)}>
                  {latestSchema.id}
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    );
  }

  const modalProps = {
    fullScreen: true,
    onDismiss: goToUploads
  };
  const headerProps = {
    title: (
      <span>
        <Link to={Links.uploads}>{I18n.home_pane.data}</Link> &gt; {upload.filename}
      </span>
    ),
    onDismiss: goToUploads
  };

  return (
    <div id="show-upload">
      <Modal {...modalProps}>
        <ModalHeader {...headerProps} />

        <ModalContent>
          {body}
        </ModalContent>
      </Modal>
    </div>
  );
}

ShowUpload.propTypes = {
  upload: PropTypes.object.isRequired,
  latestSchema: PropTypes.object,
  goToUploads: PropTypes.func.isRequired
};

function mapStateToProps(state, ownProps) {
  const params = ownProps.params;
  return query(state.db, params.uploadId);
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    goToUploads: () => {
      dispatch(push(Links.uploads(ownProps.location)));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowUpload);
