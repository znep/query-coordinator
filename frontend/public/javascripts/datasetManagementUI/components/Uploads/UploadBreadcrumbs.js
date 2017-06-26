/* eslint react/jsx-indent: 0 */
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import * as Links from 'links';
import _ from 'lodash';
import * as Selectors from 'selectors';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/Uploads/UploadBreadcrumbs.scss';

export const UploadBreadcrumbs = ({ atShowUpload, uploadId, outputSchemaId, inputSchemaId }) =>
  <ol className={styles.list}>
    <li className={atShowUpload ? styles.active : null}>
      {atShowUpload
        ? I18n.home_pane.data
        : <Link to={Links.uploads}>
            {I18n.home_pane.data}
          </Link>}
      <SocrataIcon name="arrow-right" className={styles.icon} />
    </li>
    <li className={!atShowUpload ? styles.active : null}>
      {!atShowUpload || !uploadId || !inputSchemaId || !outputSchemaId
        ? I18n.home_pane.preview
        : <Link to={Links.showOutputSchema(uploadId, inputSchemaId, outputSchemaId)}>
            {I18n.home_pane.preview}
          </Link>}
    </li>
  </ol>;

UploadBreadcrumbs.propTypes = {
  atShowUpload: PropTypes.bool,
  uploadId: PropTypes.number,
  outputSchemaId: PropTypes.number,
  inputSchemaId: PropTypes.number
};

export const mapStateToProps = ({ entities, ui }, { atShowUpload }) => {
  const upload = Selectors.latestUpload(entities);
  let currentOutputSchema = { id: null };
  let currentInputSchema = { id: null };
  let uploadId = null;

  if (upload) {
    uploadId = upload.id;

    const inputSchemaList = Object.keys(entities.input_schemas).map(
      isid => entities.input_schemas[Number(isid)]
    );

    currentInputSchema = inputSchemaList.find(is => is.upload_id === Number(uploadId)) || { id: null };

    const outputSchemasForCurrentInputSchema = currentInputSchema
      ? _.pickBy(entities.output_schemas, os => os.input_schema_id === currentInputSchema.id)
      : null;

    currentOutputSchema = !_.isEmpty(outputSchemasForCurrentInputSchema)
      ? Selectors.latestOutputSchema({ output_schemas: outputSchemasForCurrentInputSchema })
      : { id: null };
  }

  return {
    atShowUpload,
    uploadId: uploadId,
    outputSchemaId: currentOutputSchema.id,
    inputSchemaId: currentInputSchema.id
  };
};

export default connect(mapStateToProps)(UploadBreadcrumbs);
