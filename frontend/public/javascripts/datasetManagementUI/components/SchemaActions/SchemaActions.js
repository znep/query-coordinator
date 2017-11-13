import React from 'react';
import PropTypes from 'prop-types';
import * as Links from 'links/links';
import { RecentActionsTimestamp } from 'components/RecentActionItems/RecentActionItems';
import { Link } from 'react-router';
import styles from './SchemaActions.scss';

const SchemaActions = ({ oss, iss, params }) => {
  const items = oss.map((os, idx) => (
    <li key={idx} className={os.isCurrent ? styles.currentSchema : styles.schema}>
      {os.created_by.display_name} changed the schema <RecentActionsTimestamp date={os.created_at} />
      {os.isCurrent || ' - '}
      {os.isCurrent || (
        <Link
          className={styles.restoreLink}
          to={Links.showOutputSchema(params, iss[os.input_schema_id].source_id, os.input_schema_id, os.id)}>
          restore
        </Link>
      )}
    </li>
  ));
  return <ul className={styles.container}>{items}</ul>;
};

SchemaActions.propTypes = {
  oss: PropTypes.array.isRequired,
  iss: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

export default SchemaActions;
