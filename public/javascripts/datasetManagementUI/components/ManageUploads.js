import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import * as Links from '../links';
import * as Actions from '../actions/manageUploads';
import { Modal, ModalHeader, ModalContent } from 'socrata-components';
import {
  STATUS_INSERTING,
  STATUS_INSERT_FAILED
} from '../lib/database/statuses';


function query(db) {
  return {
    uploads: db.uploads.
      map((upload) => ({
        ...upload,
        schemas: db.schemas.
          filter((schema) => schema.upload_id === upload.id).
          map((schema) => ({
            ...schema,
            output_schemas: db.schemas.
              filter((outputSchema) => outputSchema.input_schema_id === schema.id)
          }))
      }))
  };
}

export function ManageUploads({ uploads, createUpload, goHome }) {
  const modalProps = {
    fullScreen: true,
    onDismiss: goHome
  };

  const headerProps = {
    title: I18n.home_pane.data,
    onDismiss: goHome
  };

  return (
    <Modal {...modalProps} >
      <ModalHeader {...headerProps} />

      <ModalContent>
        <form>
          <h6>Previous uploads</h6>
          <ul>
            {uploads.map((upload, idxInTable) => (
              <li key={idxInTable}>
                <UploadListItem upload={upload} />
              </li>
            ))}
          </ul>
          <p>
            <label id="upload-label" htmlFor="file">Upload a new file:&nbsp;</label>
            <input
              name="file"
              type="file"
              aria-labelledby="upload-label"
              onChange={(evt) => (createUpload(evt.target.files[0]))} />
          </p>
        </form>
      </ModalContent>
    </Modal>
  );
}

ManageUploads.propTypes = {
  uploads: PropTypes.arrayOf(PropTypes.object).isRequired,
  createUpload: PropTypes.func.isRequired,
  goHome: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  return query(state.db);
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    createUpload: (file) => {
      dispatch(Actions.createUpload(file));
    },
    goHome: () => {
      dispatch(push(Links.home(ownProps.location)));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageUploads);

function UploadListItem({ upload }) {
  if (upload.__status__.type === STATUS_INSERTING) {
    return (<span>{upload.filename}</span>);
  } else if (upload.__status__.type === STATUS_INSERT_FAILED) {
    return (<span>{upload.filename} (failed: {upload.__status__.error.response.statusText})</span>);
  } else if (upload.schemas.length === 1 && upload.schemas[0].output_schemas.length === 1) {
    return (
      <Link
        to={Links.showOutputSchema(
          upload.id,
          upload.schemas[0].id,
          upload.schemas[0].output_schemas[0].id)}>{upload.filename}
      </Link>
    );
  } else {
    return (
      <Link to={Links.showUpload(upload.id)}>{upload.filename}</Link>
    );
  }
}

UploadListItem.propTypes = {
  upload: PropTypes.object.isRequired
};
