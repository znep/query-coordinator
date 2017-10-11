/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';

import React from 'react';
import moment from 'moment';
import { Link } from 'react-router';
import * as Links from 'links/links';
import * as Selectors from 'selectors';
import styles from './SourceSidebar.scss';

function titleOf(source) {
  if (source.source_type.type === 'url') return source.source_type.url;
  return source.source_type.filename;
}

function descriptionOf(source) {
  return source.content_type;
}

const UploadItem = ({ entities, source, params }) => {
  const outputSchema = Selectors.latestOutputSchemaForSource(entities, source.id);

  const linkTarget = outputSchema
    ? Links.showOutputSchema(params, source.id, outputSchema.input_schema_id, outputSchema.id)
    : null;

  return (
    <li>
      <Link to={linkTarget}>{titleOf(source)}</Link>
      <p>{descriptionOf(source)}</p>
      <div className={styles.timestamp}>{moment.utc(source.finished_at).fromNow()}</div>
    </li>
  );
};

UploadItem.propTypes = {
  entities: PropTypes.object.isRequired,
  source: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

const SourceSidebar = ({ entities, currentUpload, otherUploads, params }) => {
  if (!currentUpload && otherUploads.length === 0) {
    return (
      <section className={styles.sidebar}>
        <span>{I18n.show_uploads.no_uploads}</span>
      </section>
    );
  }
  return (
    <section className={styles.sidebar}>
      {currentUpload && (
        <div>
          <h2>{I18n.show_uploads.current}</h2>
          <ul>
            <UploadItem entities={entities} source={currentUpload} params={params} />
          </ul>
        </div>
      )}
      {otherUploads.length > 0 && (
        <div>
          <h2>{currentUpload === null ? I18n.show_uploads.uploads : I18n.show_uploads.noncurrent}</h2>
          <ul>
            {otherUploads.map(source => (
              <UploadItem key={source.id} entities={entities} source={source} params={params} />
            ))}
          </ul>
        </div>
      )}
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

SourceSidebar.propTypes = {
  currentUpload: sourceProptype,
  otherUploads: PropTypes.arrayOf(sourceProptype),
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

export default SourceSidebar;
