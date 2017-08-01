import React, { PropTypes } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import moment from 'moment';
import { Link } from 'react-router';
import * as Links from 'links';
import * as Selectors from 'selectors';
import styles from 'styles/Uploads/UploadSidebar.scss';

const UploadItem = ({ entities, source }) => {
  const outputSchema = Selectors.latestOutputSchemaForSource(entities, source.id);
  const linkTarget = outputSchema
    ? Links.showOutputSchema(source.id, outputSchema.input_schema_id, outputSchema.id)
    : null;
  return (
    <li>
      <Link to={linkTarget}>
        {source.source_type && source.source_type.filename}
      </Link>
      <div className={styles.timestamp}>{moment.utc(source.finished_at).fromNow()}</div>
    </li>
  );
};

UploadItem.propTypes = {
  entities: PropTypes.object.isRequired,
  source: PropTypes.object.isRequired
};

export const UploadSidebar = ({ entities, currentUpload, otherUploads }) => {
  let content;
  if (currentUpload === null && otherUploads.length === 0) {
    content = (
      <span>{I18n.show_uploads.no_uploads}</span>
    );
  } else {
    content = (
      <div>
        {currentUpload &&
          <div>
            <h2>{I18n.show_uploads.current}</h2>
            <ul>
              {currentUpload
                ? <UploadItem entities={entities} source={currentUpload} />
                : <span>{I18n.show_uploads.no_uploads}</span>}
            </ul>
          </div>
        }
        {otherUploads.length > 0 &&
          <div>
            <h2>{currentUpload === null ? I18n.show_uploads.uploads : I18n.show_uploads.noncurrent}</h2>
            <ul>
              {otherUploads.map(source =>
                <UploadItem key={source.id} entities={entities} source={source} />
              )}
            </ul>
          </div>
        }
      </div>
    );
  }

  return (
    <section className={styles.sidebar}>
      {content}
    </section>
  );
};


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
  entities: PropTypes.object.isRequired
};

export const mapStateToProps = ({ entities }) => {
  const currentOutputSchema = Selectors.currentOutputSchema(entities);
  let currentUpload;
  let otherUploads;

  const pendingOrSuccessfulSources = _.chain(entities.sources)
    .values()
    .filter((source) => !source.failed_at)
    .value();

  if (currentOutputSchema) {
    const { input_schema_id: inputSchemaId } = currentOutputSchema;
    const { source_id: sourceId } = entities.input_schemas[inputSchemaId];

    currentUpload = entities.sources[sourceId];
    otherUploads = pendingOrSuccessfulSources.filter((source) => source.id !== sourceId);
  } else {
    // rare case where you have uploads but not a current upload
    currentUpload = null;
    otherUploads = pendingOrSuccessfulSources;
  }
  return {
    currentUpload,
    otherUploads,
    entities
  };
};

export default connect(mapStateToProps)(UploadSidebar);
