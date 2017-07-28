import React, { PropTypes } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import moment from 'moment';
import { Link, withRouter } from 'react-router';
import * as Links from 'links';
import * as Selectors from 'selectors';
import styles from 'styles/Uploads/UploadSidebar.scss';

const UploadItem = ({ source, params }) =>
  <li>
    <Link to={Links.showOutputSchema(params, source.id, source.inputSchemaId, source.outputSchemaId)}>
      {source.source_type && source.source_type.filename}
    </Link>
    <div className={styles.timestamp}>
      {moment.utc(source.finished_at).fromNow()}
    </div>
  </li>;

UploadItem.propTypes = {
  source: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

export const UploadSidebar = ({ currentUpload, otherUploads, params }) =>
  <section className={styles.sidebar}>
    <h2>
      {I18n.show_uploads.current}
    </h2>
    <ul>
      {currentUpload
        ? <UploadItem source={currentUpload} params={params} />
        : <span>
            {I18n.show_uploads.no_uploads}
        </span>}
    </ul>
    {!!otherUploads.length &&
      <h2>
        {I18n.show_uploads.noncurrent}
      </h2>}
    <ul>
      {otherUploads.map(source => <UploadItem key={source.id} params={params} source={source} />)}
    </ul>
  </section>;

const sourceProptype = PropTypes.shape({
  id: PropTypes.number,
  inputSchemaId: PropTypes.number,
  outputSchemaId: PropTypes.number,
  source_type: PropTypes.object,
  finished_at: PropTypes.object
});

UploadSidebar.propTypes = {
  currentUpload: sourceProptype,
  otherUploads: PropTypes.arrayOf(sourceProptype),
  params: PropTypes.object.isRequired
};

const getLinkInfo = inputSchemas => outputSchemas => source => {
  if (!inputSchemas || !inputSchemas.length || !Object.keys(outputSchemas).length) {
    return source;
  }
  const currentInputSchema = inputSchemas.find(is => is.source_id === source.id);

  const outputSchemasForCurrentInputSchema = currentInputSchema
    ? _.pickBy(outputSchemas, os => os.input_schema_id === currentInputSchema.id)
    : null;

  const currentOutputSchema = outputSchemasForCurrentInputSchema
    ? Selectors.latestOutputSchema({ output_schemas: outputSchemasForCurrentInputSchema })
    : { id: null };

  return {
    ...source,
    inputSchemaId: currentInputSchema ? currentInputSchema.id : null,
    outputSchemaId: currentOutputSchema.id
  };
};

export const mapStateToProps = ({ entities }) => {
  const outputSchema = Selectors.latestOutputSchema(entities);
  let currentUpload = null;
  let otherUploads = [];

  if (outputSchema) {
    const { input_schema_id: inputSchemaId, id: outputSchemaId } = outputSchema;

    const { source_id: sourceId } = entities.input_schemas[inputSchemaId];

    const noncurrentUploads = _.omit(entities.sources, sourceId);

    const noncurrentUploadsList = Object.keys(noncurrentUploads).map(id => entities.sources[id]);

    // TODO: Not doing anything with failed uploats atm. Maybe we should. Need UX input.
    // eslint-disable-next-line no-unused-vars
    const [failedUploads, pendingOrSuccessfulUploads] = _.partition(
      noncurrentUploadsList,
      source => source.failed_at
    );

    const inputSchemaList = Object.keys(entities.input_schemas).map(isid => entities.input_schemas[isid]);

    const addLinkInfo = getLinkInfo(inputSchemaList)(entities.output_schemas);

    currentUpload = {
      ...entities.sources[sourceId],
      inputSchemaId,
      outputSchemaId
    };

    otherUploads = pendingOrSuccessfulUploads.map(addLinkInfo);
  }

  return {
    currentUpload,
    otherUploads
  };
};

export default withRouter(connect(mapStateToProps)(UploadSidebar));
