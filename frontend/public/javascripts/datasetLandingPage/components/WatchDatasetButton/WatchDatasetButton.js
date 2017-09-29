import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { connect } from 'react-redux';
import subscriptionStore from 'store/subscriptionStore';
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

  render() {
    const inputAttributes = {
      id: 'show-dimension-labels',
      type: 'checkbox',
      defaultChecked: false
    };
    const { subscribed } = this.props.view;
    const watchDatasetFlagIcon = classNames('flag-icon',
      subscribed ? 'socrata-icon-watched' : 'socrata-icon-watch'
    );
    const watchDatasetButtonText = I18n.action_buttons[
      subscribed ? 'unwatch_dataset' : 'watch_dataset'
    ];

    return (
      <div className="watch-dataset-button btn btn-sm btn-default">
        <label
          onClick={(event) => this.onWatchDatasetButtonClick(event)}
          className="inline-label manage-prompt-button"
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
  onSubscriptionChange: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return {
    onSubscriptionChange(subscriptionId) {
      dispatch(subscriptionChange(subscriptionId));
    }
  };
}

export default connect(null, mapDispatchToProps)(WatchDatasetButton);
