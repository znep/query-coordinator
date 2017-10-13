/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';
import _ from 'lodash';
import React from 'react';
import moment from 'moment';
import { Link, IndexLink } from 'react-router';
import * as Links from 'links/links';
import * as Selectors from 'selectors';
import styles from './SourceSidebar.scss';

function titleOf(source) {
  if (!source || !source.source_type) {
    return '';
  }

  if (source.source_type.type === 'url') {
    return source.source_type.url;
  }

  return source.source_type.filename;
}

function descriptionOf(source) {
  return source.content_type;
}

const SourceItem = ({ entities, source, params }) => {
  if (_.isEmpty(source)) {
    return null;
  }

  const outputSchema = Selectors.latestOutputSchemaForSource(entities, source.id);

  const linkTarget = outputSchema
    ? Links.showOutputSchema(params, source.id, outputSchema.input_schema_id, outputSchema.id)
    : null;

  return (
    <li>
      <Link to={linkTarget} className={source.isCurrent ? styles.bold : ''}>
        {titleOf(source)}
      </Link>
      <p>{descriptionOf(source)}</p>
      <div className={styles.timestamp}>{moment.utc(source.finished_at).fromNow()}</div>
    </li>
  );
};

const sourceProptype = PropTypes.shape({
  id: PropTypes.number,
  inputSchemaId: PropTypes.number,
  outputSchemaId: PropTypes.number,
  source_type: PropTypes.object,
  finished_at: PropTypes.object,
  isCurrent: PropTypes.bool
});

SourceItem.propTypes = {
  source: sourceProptype,
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

export const SourceList = ({ entities, params, sources }) => {
  return (
    <ul className={styles.sourceList}>
      <h2>{I18n.show_uploads.sources}</h2>
      {sources.map((source, idx) => (
        <SourceItem entities={entities} params={params} source={source} key={idx} />
      ))}
    </ul>
  );
};

SourceList.propTypes = {
  sources: PropTypes.arrayOf(sourceProptype),
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

const SourceSidebar = ({ entities, sources, params }) => {
  return (
    <section className={styles.sidebar}>
      <IndexLink to={Links.sources(params)} className={styles.tab} activeClassName={styles.selected}>
        Upload a Data File
      </IndexLink>
      <Link to={Links.urlSource(params)} className={styles.tab} activeClassName={styles.selected}>
        Connect to a Data Source
      </Link>
      {sources.length && <SourceList entities={entities} sources={sources} params={params} />}
    </section>
  );
};

SourceSidebar.propTypes = {
  sources: PropTypes.arrayOf(sourceProptype),
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

export default SourceSidebar;
