import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';
import { Link } from 'react-router';
import SocrataIcon from '../../../common/components/SocrataIcon';
import * as Links from 'links';
import styles from './RecentActionItems.scss';

const RecentActionsTimestamp = ({ date }) =>
  <span className={styles.timestamp}>
    {moment.utc(date).fromNow()}
  </span>;

RecentActionsTimestamp.propTypes = {
  date: PropTypes.object.isRequired
};

export const RevisionActivity = ({ details }) =>
  <div className={styles.activity} data-activity-type="update">
    <div className={styles.timeline}>
      <SocrataIcon name="plus2" className={styles.icon} />
    </div>
    <div>
      <p>
        <a href={`/profile/${window.serverConfig.currentUserId}`} className={styles.createdBy}>
          {details.createdBy}
        </a>{' '}
        opened a revision
      </p>
      <RecentActionsTimestamp date={details.createdAt} />
    </div>
  </div>;

RevisionActivity.propTypes = {
  details: PropTypes.shape({
    createdAt: PropTypes.object,
    createdBy: PropTypes.string
  }).isRequired
};

export const SourceActivity = ({ details }) =>
  <div className={styles.activity} data-activity-type="source">
    <div className={styles.timeline}>
      <SocrataIcon name="data" className={styles.icon} />
    </div>
    <div>
      <p>
        <a href={`/profile/${window.serverConfig.currentUserId}`} className={styles.createdBy}>
          {details.createdBy}
        </a>{' '}
        uploaded a file
      </p>
      <RecentActionsTimestamp date={details.createdAt} />
    </div>
  </div>;

SourceActivity.propTypes = {
  details: PropTypes.shape({
    createdAt: PropTypes.object,
    createdBy: PropTypes.string
  }).isRequired
};

export const OutputSchemaActivity = ({ details, params }) =>
  <div className={styles.activity} data-activity-type="outputschema">
    <div className={styles.timeline}>
      <SocrataIcon name="edit" className={styles.icon} />
    </div>
    <div>
      <p>
        <a href={`/profile/${window.serverConfig.currentUserId}`} className={styles.createdBy}>
          {details.createdBy}
        </a>{' '}
        changed the&nbsp;
        <Link to={Links.showOutputSchema(params, details.sourceId, details.isid, details.osid)}>schema</Link>
      </p>
      <RecentActionsTimestamp date={details.createdAt} />
    </div>
  </div>;

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

export const TaskSetActivity = ({ details }) =>
  <div className={styles.activity} data-activity-type="taskSet">
    <div className={styles.timeline}>
      <SocrataIcon name="dataset" className={styles.icon} />
    </div>
    <div>
      <p>
        <a href={`/profile/${window.serverConfig.currentUserId}`} className={styles.createdBy}>
          {details.createdBy}
        </a>{' '}
        started data processing
      </p>
      <RecentActionsTimestamp date={details.createdAt} />
    </div>
  </div>;

TaskSetActivity.propTypes = {
  details: PropTypes.shape({
    createdAt: PropTypes.object,
    createdBy: PropTypes.string
  }).isRequired
};

export const TaskSetFinishedActivity = ({ details }) =>
  <div className={styles.activity} data-activity-type="taskSetcompleted">
    <div className={styles.timeline}>
      <SocrataIcon name="checkmark3" className={styles.icon} />
    </div>
    <div>
      <p>Data processing successfully finished</p>
      <RecentActionsTimestamp date={details.createdAt} />
    </div>
  </div>;

TaskSetFinishedActivity.propTypes = {
  details: PropTypes.shape({
    createdAt: PropTypes.object,
    createdBy: PropTypes.string
  }).isRequired
};

export const TaskSetFailedActivity = ({ details }) =>
  <div className={styles.activity} data-activity-type="taskSetfailed">
    <div className={styles.timeline}>
      <SocrataIcon name="failed" className={styles.icon} />
    </div>
    <div>
      <p>Data processing failed</p>
      <RecentActionsTimestamp date={details.createdAt} />
    </div>
  </div>;

TaskSetFailedActivity.propTypes = {
  details: PropTypes.shape({
    createdAt: PropTypes.object,
    createdBy: PropTypes.string
  }).isRequired
};
