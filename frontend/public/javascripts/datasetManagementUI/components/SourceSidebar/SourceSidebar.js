/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';
import _ from 'lodash';
import React from 'react';
import moment from 'moment';
import { Link, IndexLink } from 'react-router';
import * as Links from 'links/links';
import * as Selectors from 'selectors';
import styles from './SourceSidebar.module.scss';

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

export const MultiSourceItem = ({ entities, source, params }) => {
  const noBytesUploaded = !(source.finished_at || source.failed_at);
  if (_.isEmpty(source) || noBytesUploaded) {
    return null;
  }

  const outputSchema = Selectors.latestOutputSchemaForSource(entities, source.id);
  const columns = Selectors.columnsForOutputSchema(entities, outputSchema.id);
  const linkTarget = outputSchema
    ? Links.showOutputSchema(params, source.id, outputSchema.input_schema_id, outputSchema.id)
    : Links.showBlobPreview(params, source.id);

  let rows = I18n.show_uploads.in_progress;
  if (outputSchema.total_rows) {
    rows = I18n.show_uploads.total_rows.format(
      outputSchema.total_rows,
      columns.length
    );
  }

  return (
    <div>
        <Link to={linkTarget} className={source.isCurrent ? styles.bold : ''}>
          {rows}{' '}
          <div className={styles.timestamp}>
            {moment.utc(source.finished_at).fromNow()}
          </div>
        </Link>
    </div>
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


MultiSourceItem.propTypes = {
  source: sourceProptype,
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};


export const MultiParseOptionsGroup = ({ entities, sources, params }) => {
  const [source] = sources;
  return (<li>
    {titleOf(source)}
    <p>{descriptionOf(source)}</p>

    {sources.map((src, idx) => (
      <MultiSourceItem entities={entities} params={params} source={src} key={idx} />
    ))}
  </li>);
};

MultiParseOptionsGroup.propTypes = {
  sources: PropTypes.arrayOf(sourceProptype),
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

export const SingleSourceItem = ({ entities, source, params }) => {
  const noBytesUploaded = !(source.finished_at || source.failed_at);
  if (_.isEmpty(source) || noBytesUploaded) {
    return null;
  }

  const outputSchema = Selectors.latestOutputSchemaForSource(entities, source.id);

  const linkTarget = outputSchema
    ? Links.showOutputSchema(params, source.id, outputSchema.input_schema_id, outputSchema.id)
    : Links.showBlobPreview(params, source.id);

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

SingleSourceItem.propTypes = {
  source: sourceProptype,
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

export const SourceList = ({ entities, params, sources }) => {
  const groups = _.map(_.groupBy(sources, (src) => src.blob), (group) => {
    return _.sortBy(group, (source) => -source.id);
  });
  return (
    <ul className={styles.sourceList}>
      <h2>{I18n.show_uploads.sources}</h2>
      {groups.map((group, idx) => {
        if (group.length === 1) {
          const [source] = group;
          return (
            <SingleSourceItem entities={entities} params={params} source={source} key={idx} />
          );
        } else {
          return (
            <MultiParseOptionsGroup entities={entities} params={params} sources={group} key={idx} />
          );
        }
      })}
    </ul>
  );
};

SourceList.propTypes = {
  sources: PropTypes.arrayOf(sourceProptype),
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

const SourceSidebar = ({ entities, sources, params, hideHrefLink }) => {
  return (
    <section className={styles.sidebar}>
      <IndexLink to={Links.sources(params)} className={styles.tab} activeClassName={styles.selected}>
        {I18n.show_uploads.upload_link}
      </IndexLink>
      <Link to={Links.urlSource(params)} className={styles.tab} activeClassName={styles.selected}>
        {I18n.show_uploads.url_link}
      </Link>
      {hideHrefLink || (
        <Link to={Links.hrefSource(params)} className={styles.tab} activeClassName={styles.selected}>
          {I18n.show_uploads.external_source}
        </Link>
      )}
      {!!sources.length && <SourceList entities={entities} sources={sources} params={params} />}
    </section>
  );
};

SourceSidebar.propTypes = {
  sources: PropTypes.arrayOf(sourceProptype),
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  hideHrefLink: PropTypes.bool.isRequired
};

export default SourceSidebar;
