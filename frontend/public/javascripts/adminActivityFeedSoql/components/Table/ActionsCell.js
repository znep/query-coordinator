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
    const { restorableList, activity, data } = this.props;
    const activitiesWithSameUid = data.
      filter(row => row.dataset_uid === activity.dataset_uid && row.activity_type === 'AssetDeleted');

    const firstInList = _.get(activitiesWithSameUid, '[0].id');

    return firstInList === activity.id && restorableList[activity.dataset_uid];
  }

  isRestored() {
    const { restorableList, activity } = this.props;

    // Check if restorableList has uid as a key and value is false.
    return !_.isUndefined(restorableList[activity.dataset_uid]) && !restorableList[activity.dataset_uid];
  }

  handleRestoreClicked = () => {
    const { activity } = this.props;

    this.props.showRestoreModal(activity.dataset_uid);
  }

  renderRestoreButton() {
    const linkProps = {
      href: '#',
      className: 'unstyled-link',
      tabIndex: 0,
      onClick: this.handleRestoreClicked
    };

    return (
      <a {...linkProps}>
        <LocalizedText localeKey="screens.admin.activity_feed.restore" />
      </a>
    );
  }

  renderRestoredIndicator() {
    return (
      <LocalizedText
        className="restored-dataset"
        localeKey="screens.admin.activity_feed.restored" />
    );
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

    if (isRestorable) {
      return this.renderRestoreButton();
    } else if (isRestored) {
      return this.renderRestoredIndicator();
    } else if (hasDetails) {
      return this.renderDetailsButton();
    } else {
      return null;
    }
  }
}

ActionsCell.defaultProps = {
  openDetailsId: null,
  restorableList: {}
};

ActionsCell.propTypes = {
  activity: propTypes.object.isRequired,
  showDetails: propTypes.func.isRequired,
  hideDetails: propTypes.func.isRequired,
  openDetailsId: propTypes.string,
  showRestoreModal: propTypes.func.isRequired,
  restorableList: propTypes.object
};

const mapStateToProps = (state) => ({
  restorableList: state.table.restorableList,
  data: state.table.data
});

const mapDispatchToProps = dispatch => ({
  showDetails: (id) => dispatch(actions.table.showDetails(id)),
  hideDetails: () => dispatch(actions.table.hideDetails()),
  showRestoreModal: (id) => dispatch(actions.common.showRestoreModal(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(ActionsCell);
