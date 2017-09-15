import PropTypes from 'prop-types';
import React from 'react';
import * as helpers from '../helpers';

import LocalizedText from 'common/i18n/components/LocalizedText';

export default class ActivityActions extends React.Component {
  constructor(props) {
    super(props);

    this.handleRestoreClicked = this.handleRestoreClicked.bind(this);
    this.handleShowDetailsClicked = this.handleShowDetailsClicked.bind(this);
  }

  handleShowDetailsClicked() {
    const { activity, onShowDetails } = this.props;
    onShowDetails(activity.toJS());
  }

  handleRestoreClicked() {
    const { activity, onRestore } = this.props;
    onRestore(activity.toJS());
  }

  renderRestoreButton() {
    return (
      <button className='restore-modal-link button-as-link' onClick={this.handleRestoreClicked}>
        <LocalizedText localeKey='screens.admin.jobs.restore'/>
      </button>
    );
  }

  renderRestoredIndicator() {
    return <LocalizedText localeKey='screens.admin.jobs.restored' className='restored-dataset'/>;
  }

  renderDetailsButton() {
    return (
      <button
        className='details-modal-link button-as-link'
        onClick={this.handleShowDetailsClicked}>
        <LocalizedText localeKey='screens.admin.jobs.view_details'/>
      </button>
    );
  }

  render() {
    const activity = this.props.activity;

    const hasDetails = helpers.activities.hasDetails(activity);
    const isRestorable = helpers.activities.isRestorable(activity);
    const isRestored = helpers.activities.isRestored(activity);
    const isRestoreExpired = helpers.activities.isRestoreExpired(activity);

    if (isRestorable) {
      return this.renderRestoreButton();
    } else if (isRestored && !isRestoreExpired) {
      return this.renderRestoredIndicator();
    } else if (hasDetails) {
      return this.renderDetailsButton();
    } else {
      return null;
    }
  }
}

ActivityActions.propTypes = {
  activity: PropTypes.object.isRequired,
  onShowDetails: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired
};
