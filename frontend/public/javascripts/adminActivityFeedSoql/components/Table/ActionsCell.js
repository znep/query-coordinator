import _ from 'lodash';
import React, { PureComponent } from 'react';
import propTypes from 'prop-types';
import { connect } from 'react-redux';
import LocalizedText from 'common/i18n/components/LocalizedText';
import { DATA_UPDATE_METHODS } from '../../constants';
import * as actions from '../../actions';

class ActionsCell extends PureComponent {

  hasDetails(activity) {
    const methods = DATA_UPDATE_METHODS.join('|');
    const rx = new RegExp(`^DataUpdate\.(${methods})\.(SuccessWithDataErrors|Failure)`);

    return rx.test(_.get(activity, 'activity_type', ''));
  }

  isRestorable() {
    return false;
  }

  isRestored() {
    return false;
  }

  isRestoreExpired() {
    return false;
  }

  handleRestoreClicked() {
    return null;
  }

  renderRestoreButton() {
    return null;
  }

  renderRestoredIndicator() {
    return null;
  }

  renderDetailsButton = () => {
    const { activity, openDetailsId, showDetails, hideDetails } = this.props;

    const linkProps = {
      href: '#',
      className: 'unstyled-link',
      tabIndex: 0
    };

    if (openDetailsId && openDetailsId === activity.id) {
      linkProps.onClick = hideDetails;

      return (
        <a {...linkProps}>
          <LocalizedText localeKey="screens.admin.activity_feed.hide_details" />
        </a>
      );
    } else {
      linkProps.onClick = showDetails.bind(null, activity.id);

      return (
        <a {...linkProps}>
          <LocalizedText localeKey="screens.admin.activity_feed.show_details" />
        </a>
      );
    }
  }

  render() {
    const { activity } = this.props;

    const hasDetails = this.hasDetails(activity);
    const isRestorable = this.isRestorable(activity);
    const isRestored = this.isRestored(activity);
    const isRestoreExpired = this.isRestoreExpired(activity);

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

ActionsCell.propTypes = {
  activity: propTypes.object.isRequired,
  showDetails: propTypes.func.isRequired,
  hideDetails: propTypes.func.isRequired,
  openDetailsId: propTypes.string
};

const mapDispatchToProps = dispatch => ({
  showDetails: (id) => dispatch(actions.table.showDetails(id)),
  hideDetails: () => dispatch(actions.table.hideDetails())
});

export default connect(null, mapDispatchToProps)(ActionsCell);
