import _ from 'lodash';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import * as Links from '../links';
import * as Actions from '../actions/manageUploads';
import { Modal, ModalHeader, ModalContent } from 'common/components';
import SocrataIcon from '../../common/components/SocrataIcon';
import styles from 'styles/ManageUploads.scss';

function query(entities) {
  return {
    uploads: _.map(entities.uploads, upload => ({
      ...upload,
      input_schemas: _.filter(
        entities.input_schemas,
        schema => schema.upload_id === upload.id
      ).map(schema => ({
        ...schema,
        output_schemas: _.filter(
          entities.output_schemas,
          outputSchema => outputSchema.input_schema_id === schema.id
        )
      }))
    }))
  };
}

// this whole page soon to be replaced: EN-16150
export function ManageUploads({ uploads, createUpload, goHome }) {
  const modalProps = {
    fullScreen: true,
    onDismiss: goHome
  };

  const lastUpload = _.last(uploads);

  let nextCrumb;
  if (
    lastUpload &&
    _.get(lastUpload, 'id') &&
    _.get(lastUpload, 'input_schemas[0].id') &&
    _.get(lastUpload, 'input_schemas[0].output_schemas[0].id')
  ) {
    nextCrumb = (
      <Link
        to={Links.showOutputSchema(
          lastUpload.id,
          lastUpload.input_schemas[0].id,
          lastUpload.input_schemas[0].output_schemas[0].id
        )}>
        {I18n.home_pane.preview}
      </Link>
    );
  } else {
    nextCrumb = I18n.home_pane.preview;
  }

  const headerProps = {
    title: (
      <ol className={styles.list}>
        <li className={styles.active}>
          {I18n.home_pane.data}
          <SocrataIcon name="arrow-right" className={styles.icon} />
        </li>
        <li>
          {nextCrumb}
        </li>
      </ol>
    ),
    onDismiss: goHome
  };

  return (
    <Modal {...modalProps}>
      <ModalHeader {...headerProps} />

      <ModalContent>
        <form>
          <h2 className={styles.header}>{I18n.manage_uploads.previous}</h2>
          <ul>
            {uploads.map((upload, idxInTable) =>
              <li key={idxInTable}>
                <UploadListItem upload={upload} />
              </li>
            )}
          </ul>
          <p>
            <label id="upload-label" htmlFor="file">{I18n.manage_uploads.new_file}&nbsp;</label>
            <input
              id="file"
              name="file"
              type="file"
              aria-labelledby="upload-label"
              onChange={evt => createUpload(evt.target.files[0])} />
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

function mapStateToProps({ entities }) {
  return query(entities);
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    createUpload: file => {
      dispatch(Actions.createUpload(file));
    },
    goHome: () => {
      dispatch(push(Links.home(ownProps.location)));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageUploads);

function UploadListItem({ upload }) {
  return <Link to={Links.showUpload(upload.id)}>{upload.filename}</Link>;
}

UploadListItem.propTypes = {
  upload: PropTypes.object.isRequired
};
