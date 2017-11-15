/**
 * A higher-order component that facilitates access to Spandex suggestions.
 *
 * After being wrapped by SpandexSubscriber, your component will automatically
 * trigger Spandex availability checks and replication requests as needed. All
 * props related to this HOC are namespaced under the `spandex` key; your
 * component will need to provide `datasetUid` and `domain`, in this namespace,
 * and the HOC provides `available` (which may be true/false/undefined, as per
 * the semantics of the Spandex response) and `provider` (which exposes a method
 * for fetching suggestions; see SpandexDataProvder).
 */

import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import 'whatwg-fetch';

import { defaultHeaders, fetchJson } from 'common/http';

import SpandexDataProvider from './provider';

export const REPLICATION_KEY = 'autocomplete_replication_up_to_date';
const DEFAULT_INTERVAL = 3 * 1000;
const DEFAULT_TIMEOUT = (60 + 1) * 1000;

/**
 * Factory for parameterized SpandexSubscriber HOCs.
 *
 * @param pollInterval Time between Spandex status checks (ms)
 * @param pollTimeout Maximum time allowed for Spandex status checks (ms)
 * @return The SpandexSubscriber HOC, ready to wrap your component
 */
export default (pollInterval = DEFAULT_INTERVAL, pollTimeout = DEFAULT_TIMEOUT) => {
  if (!_.isFinite(pollInterval) || !_.isFinite(pollTimeout)) {
    throw new Error('SpandexSubscriber: Poll interval and timeout must be numeric!');
  } else if (pollInterval <= 0 || pollTimeout <= 0) {
    throw new Error('SpandexSubscriber: Poll interval and timeout must be positive!');
  }

  return (WrappedComponent) => {
    class SpandexSubscriber extends Component {
      constructor(props) {
        super(props);

        this.provider = new SpandexDataProvider(props.spandex);

        this.state = {
          available: false,
          initiated: false
        };
      }

      componentWillMount() {
        // Wire up the polling callback, which will check replication status and
        // initiate replication if necessary. To minimize network traffic, we
        // stop polling once Spandex replication is known to be available,
        // because we don't expect a given page load to be active longer than
        // the quiet period that triggers de-indexing.
        this.pollIntervalId = setInterval(() => {
          switch (this.state.available) {
            case true:
              clearInterval(this.pollIntervalId);
              clearTimeout(this.pollTimeoutId);
              break;

            case false:
              this.checkReplicationStatus();
              break;

            default:
              this.initiateReplication();
              break;
          }
        }, pollInterval);

        // Wire up the timeout callback, which will cause the component to give
        // up and assume that Spandex replication won't ever be available. This
        // timeout is needed because replication has massive variance even under
        // normal conditions, depending on dataset size - from seconds to hours.
        // The default timeout value is a very rough "90th percentile" guess.
        this.pollTimeoutId = setTimeout(() => {
          clearInterval(this.pollIntervalId);
        }, pollTimeout);
      }

      // Ping the replication endpoint and update our knowledge of availability.
      checkReplicationStatus() {
        const { datasetUid, domain } = this.props.spandex;
        const url = `https://${domain}/api/views/${datasetUid}/replication.json`;
        const fetchOptions = {
          headers: defaultHeaders,
          credentials: 'same-origin'
        };

        fetchJson(url, fetchOptions).
          then(response => this.setState({
            available: response[REPLICATION_KEY]
          }));
      }

      // Poke the backend to initiate replication.
      initiateReplication() {
        // Don't attempt to poke more than once, as an extra precaution in case
        // something in the NBE stack goes haywire and initiation always fails.
        if (this.state.initiated) {
          console.log('SpandexSubscriber attempted to initiate twice; possible error?');
          return false;
        }

        const { datasetUid, domain } = this.props.spandex;
        const url = `https://${domain}/datasets/${datasetUid}/setup_autocomplete`;
        const fetchOptions = {
          method: 'POST',
          headers: defaultHeaders,
          credentials: 'same-origin'
        };

        fetch(url, fetchOptions);

        this.setState({
          available: false,
          initiated: true
        });

        return true;
      }

      // Decorate the existing Spandex props with more info, then pass through.
      render() {
        const props = _.extend({}, this.props);

        _.extend(
          props.spandex,
          _.pick(this.state, ['available']),
          { provider: this.provider }
        );

        return (<WrappedComponent {...props} />);
      }
    }

    SpandexSubscriber.propTypes = {
      ...WrappedComponent.propTypes,
      spandex: PropTypes.shape({
        datasetUid: PropTypes.string.isRequired,
        domain: PropTypes.string.isRequired
      }).isRequired
    };

    return SpandexSubscriber;
  };
};
