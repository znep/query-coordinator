import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';
import { Link } from 'react-router';
import SocrataIcon from '../../../common/components/SocrataIcon';
import * as Links from 'datasetManagementUI/links/links';
import styles from './RecentActionItems.module.scss';
import I18n from 'common/i18n';

const scope = 'dataset_management_ui.home_pane.home_pane_sidebar';

export const RecentActionsTimestamp = ({ date }) => (
  <span className={styles.timestamp}>{moment.utc(date).locale(I18n.locale).fromNow()}</span>
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
        {I18n.t('opened_revision', { scope })}
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
  if (previousSource) return I18n.t('changed_parse_options', { scope });
  if (source.source_type && source.source_type.type === 'url') return I18n.t('added_a_url_source', { scope });
  if (source.source_type && source.source_type.type === 'upload') return I18n.t('added_an_upload', { scope });
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
        {I18n.t('started_processing', { scope })}
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
      <p className={styles.activityDetails}>{I18n.t('processing_succeeded', { scope })}</p>
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
      <p className={styles.activityDetails}>{I18n.t('processing_failed', { scope })}</p>
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
