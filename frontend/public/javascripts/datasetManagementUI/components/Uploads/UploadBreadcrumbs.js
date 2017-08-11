/* eslint react/jsx-indent: 0 */
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router';
import * as Links from 'links';
import _ from 'lodash';
import * as Selectors from 'selectors';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/Uploads/UploadBreadcrumbs.scss';

export const UploadBreadcrumbs = ({ atShowUpload, sourceId, outputSchemaId, inputSchemaId, params }) =>
  <ol className={styles.list}>
    <li className={atShowUpload ? styles.active : null}>
      {atShowUpload
        ? I18n.home_pane.data
        : <Link to={Links.sources(params)}>
            {I18n.home_pane.data}
          </Link>}
      <SocrataIcon name="arrow-right" className={styles.icon} />
    </li>
    <li className={!atShowUpload ? styles.active : null}>
      {!atShowUpload || !sourceId || !inputSchemaId || !outputSchemaId
        ? I18n.home_pane.preview
        : <Link to={Links.showOutputSchema(params, sourceId, inputSchemaId, outputSchemaId)}>
            {I18n.home_pane.preview}
          </Link>}
    </li>
  </ol>;

UploadBreadcrumbs.propTypes = {
  atShowUpload: PropTypes.bool,
  sourceId: PropTypes.number,
  outputSchemaId: PropTypes.number,
  inputSchemaId: PropTypes.number,
  params: PropTypes.object.isRequired
};

export const mapStateToProps = ({ entities, ui }, { atShowUpload }) => {
  const source = Selectors.latestSource(entities);
  let currentOutputSchema = { id: null };
  let currentInputSchema = { id: null };
  let sourceId = null;

  if (source) {
    sourceId = source.id;

    const inputSchemaList = Object.keys(entities.input_schemas).map(
      isid => entities.input_schemas[Number(isid)]
    );

    currentInputSchema = inputSchemaList.find(is => is.source_id === Number(sourceId)) || { id: null };

    const outputSchemasForCurrentInputSchema = currentInputSchema
      ? _.pickBy(entities.output_schemas, os => os.input_schema_id === currentInputSchema.id)
      : null;

    currentOutputSchema = !_.isEmpty(outputSchemasForCurrentInputSchema)
      ? _.maxBy(_.values(outputSchemasForCurrentInputSchema), 'id') // TODO: use revision current output schema if it's on this input schema
      : { id: null };
  }

  return {
    atShowUpload,
    sourceId,
    outputSchemaId: currentOutputSchema.id,
    inputSchemaId: currentInputSchema.id
  };
};

export default withRouter(connect(mapStateToProps)(UploadBreadcrumbs));
