import _ from 'lodash';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent } from 'common/components';
import * as Links from '../links';
import * as Selectors from '../selectors';
import SocrataIcon from '../../common/components/SocrataIcon';
import styles from 'styles/ShowUpload.scss';

function query(entities, uploadId) {
  const upload = entities.uploads[_.toNumber(uploadId)];
  const inputSchemas = _.filter(entities.input_schemas, { upload_id: upload.id });

  return {
    upload,
    latestOutputSchema: inputSchemas.length ? Selectors.latestOutputSchema(entities) : null
  };
}

function ShowUpload({ upload, latestOutputSchema, goHome }) {
  let body;
  if (!latestOutputSchema) {
    body = (
      <div className={styles.centeredContainer}>
        <span className={styles.spinner} />
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
                    upload.id,
                    latestOutputSchema.input_schema_id,
                    latestOutputSchema.id
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
      <ol className={styles.list}>
        <li className={styles.active}>
          {I18n.home_pane.data}
          <SocrataIcon name="arrow-right" className={styles.icon} />
        </li>
        <li>
          {I18n.home_pane.preview}
        </li>
      </ol>
    ),
    onDismiss: goHome
  };

  return (
    <div className={styles.showUpload}>
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
  return query(state.entities, params.uploadId);
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    goHome: () => {
      dispatch(push(Links.home(ownProps.location)));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowUpload);
