import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { connect } from 'react-redux';
import subscriptionStore from 'datasetLandingPage/store/subscriptionStore';
import classNames from 'classnames';
import { onSubscriptionChange as subscriptionChange } from '../../actions/view';

export class WatchDatasetButton extends Component {

  onWatchDatasetButtonClick(event) {
    const { view, onSubscriptionChange } = this.props;
    const promise = view.subscribed ?
      subscriptionStore.unsubscribe(view.subscriptionId) :
      subscriptionStore.subscribe(view.id);

    promise.then((subscribedResult) => {
      onSubscriptionChange(_.get(subscribedResult, 'id', null));
    }).
    catch(() => onSubscriptionChange(null));
    event.preventDefault();
  }

  watchButtonText(subscribed, useDataAssetStrings) {
    if (useDataAssetStrings) {
      return I18n.action_buttons[
          subscribed ? 'unwatch_data_asset' : 'watch_data_asset'
        ];
    } else {
      return I18n.action_buttons[
          subscribed ? 'unwatch_dataset' : 'watch_dataset'
        ];
    }
  }

  render() {
    const inputAttributes = {
      id: 'show-dimension-labels',
      type: 'checkbox',
      defaultChecked: false
    };
    const { subscribed } = this.props.view;
    const { useDataAssetStrings } = this.props;
    const watchDatasetFlagIcon = classNames('flag-icon',
      subscribed ? 'socrata-icon-watched' : 'socrata-icon-watch'
    );
    const watchDatasetButtonText = this.watchButtonText(subscribed, useDataAssetStrings);

    return (
      <div className="watch-dataset-button">
        <label
          onClick={(event) => this.onWatchDatasetButtonClick(event)}
          className="inline-label manage-prompt-button btn btn-sm btn-default"
          htmlFor={inputAttributes.id}>
          <span className={watchDatasetFlagIcon}></span>
          <span className="checkbox-with-icon-label">{watchDatasetButtonText}</span>
        </label>
      </div>
    );
  }
}

WatchDatasetButton.propTypes = {
  view: PropTypes.object.isRequired,
  onSubscriptionChange: PropTypes.func,
  useDataAssetStrings: PropTypes.bool
};

function mapDispatchToProps(dispatch) {
  return {
    onSubscriptionChange(subscriptionId) {
      dispatch(subscriptionChange(subscriptionId));
    }
  };
}

export default connect(null, mapDispatchToProps)(WatchDatasetButton);
