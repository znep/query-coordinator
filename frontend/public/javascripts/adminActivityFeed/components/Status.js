import PropTypes from 'prop-types';
import React from 'react';
import LocalizedText from 'common/i18n/components/LocalizedText';

import './Status.scss';

const statusIcons = {
  'failure': 'socrata-icon-close-circle',
  'in_progress': 'socrata-icon-progress',
  'not_started': 'socrata-icon-pause',
  'success': 'socrata-icon-checkmark-alt',
  'success_with_data_errors': 'socrata-icon-warning-alt'
};

export default class Status extends React.Component {
  render() {
    const { status } = this.props;
    const iconClassName = statusIcons[status];

    return (
      <div className='activity-status' data-status={status}>
        <i className={iconClassName}/>
        <LocalizedText localeKey={`screens.admin.jobs.statuses.${status}`}/>
      </div>
    );
  }
}

Status.propTypes = {
  status: PropTypes.string.isRequired
};
