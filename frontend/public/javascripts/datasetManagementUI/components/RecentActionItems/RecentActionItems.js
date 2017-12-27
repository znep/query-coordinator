import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';
import { Link } from 'react-router';
import SocrataIcon from '../../../common/components/SocrataIcon';
import * as Links from 'links/links';
import styles from './RecentActionItems.module.scss';

const SubI18n = I18n.home_pane.home_pane_sidebar;

export const RecentActionsTimestamp = ({ date }) => (
  <span className={styles.timestamp}>{moment.utc(date).fromNow()}</span>
);

RecentActionsTimestamp.propTypes = {
  date: PropTypes.object.isRequired
};

export const RevisionActivity = ({ details }) => (
  <div className={styles.activity} data-activity-type="update">
    <div className={styles.timeline}>
      <SocrataIcon name="plus2" className={styles.icon} />
    </div>
    <div>
      <p className={styles.activityDetails}>
        <a href={`/profile/${window.serverConfig.currentUser.id}`} className={styles.createdBy}>
          {details.createdBy}
        </a>{' '}
        {SubI18n.opened_revision}
      </p>
      <RecentActionsTimestamp date={details.createdAt} />
    </div>
  </div>
);

RevisionActivity.propTypes = {
  details: PropTypes.shape({
    createdAt: PropTypes.object,
    createdBy: PropTypes.string
  }).isRequired
};

const sourceActionLabel = (source, previousSource) => {
  if (previousSource) return SubI18n.changed_parse_options;
  if (source.source_type && source.source_type.type === 'url') return SubI18n.added_a_url_source;
  if (source.source_type && source.source_type.type === 'upload') return SubI18n.added_an_upload;
};

const sourceActionDetails = (source) => {
  if (source.source_type && source.source_type.type === 'url') return source.source_type.url;
  if (source.source_type && source.source_type.type === 'upload') return source.source_type.filename;
};

export const SourceActivity = ({ details }) => {
  const { source, previousSource } = details;
  return (
    <div className={styles.activity} data-activity-type="source">
      <div className={styles.timeline}>
        <SocrataIcon name="data" className={styles.icon} />
      </div>
      <div>
        <p className={styles.activityDetails}>
          <a href={`/profile/${window.serverConfig.currentUser.id}`} className={styles.createdBy}>
            {details.createdBy}
          </a>{' '}
          {sourceActionLabel(source, previousSource)}
        </p>
        <p className={styles.muted}>
          {sourceActionDetails(source, previousSource)}
        </p>
        <RecentActionsTimestamp date={details.createdAt} />
      </div>
    </div>
  );
};

SourceActivity.propTypes = {
  details: PropTypes.shape({
    createdAt: PropTypes.object,
    createdBy: PropTypes.string,
    source: PropTypes.object,
    previousSource: PropTypes.object
  }).isRequired
};

export const OutputSchemaActivity = ({ details, params }) => (
  <div className={styles.activity} data-activity-type="outputschema">
    <div className={styles.timeline}>
      <SocrataIcon name="edit" className={styles.icon} />
    </div>
    <div>
      <p className={styles.activityDetails}>
        <a href={`/profile/${window.serverConfig.currentUser.id}`} className={styles.createdBy}>
          {details.createdBy}
        </a>{' '}
        changed the&nbsp;
        <Link to={Links.showOutputSchema(params, details.sourceId, details.isid, details.osid)}>schema</Link>
      </p>
      <RecentActionsTimestamp date={details.createdAt} />
    </div>
  </div>
);

OutputSchemaActivity.propTypes = {
  details: PropTypes.shape({
    createdAt: PropTypes.object,
    createdBy: PropTypes.string,
    sourceId: PropTypes.number,
    isid: PropTypes.number,
    osid: PropTypes.number
  }).isRequired,
  params: PropTypes.object.isRequired
};

export const TaskSetActivity = ({ details }) => (
  <div className={styles.activity} data-activity-type="taskSet">
    <div className={styles.timeline}>
      <SocrataIcon name="dataset" className={styles.icon} />
    </div>
    <div>
      <p className={styles.activityDetails}>
        <a href={`/profile/${window.serverConfig.currentUser.id}`} className={styles.createdBy}>
          {details.createdBy}
        </a>{' '}
        {SubI18n.started_processing}
      </p>
      <RecentActionsTimestamp date={details.createdAt} />
    </div>
  </div>
);

TaskSetActivity.propTypes = {
  details: PropTypes.shape({
    createdAt: PropTypes.object,
    createdBy: PropTypes.string
  }).isRequired
};

export const TaskSetFinishedActivity = ({ details }) => (
  <div className={styles.activity} data-activity-type="taskSetcompleted">
    <div className={styles.timeline}>
      <SocrataIcon name="checkmark3" className={styles.icon} />
    </div>
    <div>
      <p className={styles.activityDetails}>{SubI18n.processing_succeeded}</p>
      <RecentActionsTimestamp date={details.createdAt} />
    </div>
  </div>
);

TaskSetFinishedActivity.propTypes = {
  details: PropTypes.shape({
    createdAt: PropTypes.object,
    createdBy: PropTypes.string
  }).isRequired
};

export const TaskSetFailedActivity = ({ details }) => (
  <div className={styles.activity} data-activity-type="taskSetfailed">
    <div className={styles.timeline}>
      <SocrataIcon name="failed" className={styles.icon} />
    </div>
    <div>
      <p className={styles.activityDetails}>{SubI18n.processing_failed}</p>
      <RecentActionsTimestamp date={details.createdAt} />
    </div>
  </div>
);

TaskSetFailedActivity.propTypes = {
  details: PropTypes.shape({
    createdAt: PropTypes.object,
    createdBy: PropTypes.string
  }).isRequired
};
