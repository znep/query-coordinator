import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent } from 'socrata-components';
import * as Links from '../links';

function query(db, uploadId) {
  const upload = _.find(db.uploads, { id: _.toNumber(uploadId) });
  const inputSchemas = _.filter(db.input_schemas, { upload_id: upload.id });
  let latestOutputSchema;

  if (inputSchemas.length) {
    const outputSchemas = _.filter(db.output_schemas, { input_schema_id: inputSchemas[0].id });
    latestOutputSchema = _.maxBy(outputSchemas, 'id');
  }

  return {
    upload,
    latestOutputSchema
  };
}

function ShowUpload({ upload, latestOutputSchema, goHome }) {
  let body;
  if (_.isUndefined(latestOutputSchema)) {
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
            {latestOutputSchema.name || I18n.home_pane.only_layer}
            <ul>
              <li>
                <Link
                  to={Links.showOutputSchema(
                    upload.id, latestOutputSchema.input_schema_id, latestOutputSchema.id
                  )}>
                  {latestOutputSchema.id}
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
    onDismiss: goHome
  };
  // Not going to style these breadcrumbs because this page is going to go away.
  const headerProps = {
    title: (
      <ol>
        <li className="active">
          <Link to={Links.uploads}>
            {I18n.home_pane.data}
          </Link>
          <span className="socrata-icon-arrow-right" />
        </li>
        <li>
          {I18n.home_pane.preview}
        </li>
      </ol>
    ),
    onDismiss: goHome
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
  latestOutputSchema: PropTypes.object,
  goHome: PropTypes.func.isRequired
};

function mapStateToProps(state, ownProps) {
  const params = ownProps.params;
  return query(state.db, params.uploadId);
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    goHome: () => {
      dispatch(push(Links.home(ownProps.location)));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowUpload);
