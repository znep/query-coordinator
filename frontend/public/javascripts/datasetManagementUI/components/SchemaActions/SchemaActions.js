import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import * as Links from 'datasetManagementUI/links/links';
import { RecentActionsTimestamp } from 'datasetManagementUI/components/RecentActionItems/RecentActionItems';
import { Link } from 'react-router';
import styles from './SchemaActions.module.scss';

const SubI18n = I18n.schema_actions;

const SchemaActions = ({ oss, iss, sources, params }) => {
  function getFallbackDisplayName(sourceId) {
    return _.get(sources, `${sourceId}.created_by.display_name`, '');
  }

  const items = oss.map((os, idx) => (
    <li key={idx} className={os.isCurrent ? styles.currentSchema : styles.schema}>
      {_.get(os, 'created_by.display_name', getFallbackDisplayName(iss[os.input_schema_id].source_id))}{' '}
      {SubI18n.schema_changed} <RecentActionsTimestamp date={os.created_at} />
      {os.isCurrent || ' - '}
      {os.isCurrent || (
        <Link
          className={styles.restoreLink}
          to={Links.showOutputSchema(params, iss[os.input_schema_id].source_id, os.input_schema_id, os.id)}>
          {SubI18n.restore}
        </Link>
      )}
    </li>
  ));
  return <ul className={styles.container}>{items}</ul>;
};

SchemaActions.propTypes = {
  oss: PropTypes.array.isRequired,
  iss: PropTypes.object.isRequired,
  sources: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

export default SchemaActions;
