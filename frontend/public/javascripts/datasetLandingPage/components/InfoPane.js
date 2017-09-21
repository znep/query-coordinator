import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { formatDateWithLocale } from 'common/dates';
import { emitMixpanelEvent } from '../actions/mixpanel';
import InfoPaneButtons from './InfoPaneButtons';
import InfoPaneComponent from '../../common/components/InfoPaneComponent.js';
import subscriptionStore from 'store/subscriptionStore';
import { onSubscriptionChange as subscriptionChange } from '../actions/view';
import { FeatureFlags } from 'common/feature_flags';

function mapStateToProps(state) {
  const { view } = state;

  const attribution = view.attribution ?
    { label: I18n.published_by, content: view.attribution } :
    null;

  const userNotificationsEnabled = FeatureFlags.value('enable_user_notifications') === true;

  return {
    name: view.name,
    description: view.description,
    category: view.category,
    provenance: view.provenance,
    isPrivate: view.isPrivate,
    subscribed: view.subscribed,
    view: view,
    showWatchDatasetFlag:
      (_.get(window, 'sessionData.email', '') !== '' && userNotificationsEnabled),
    metadata: {
      first: {
        label: I18n.common.updated,
        content: formatDateWithLocale(view.lastUpdatedAt)
      },
      second: attribution
    },
    onWatchDatasetFlagClick: (ownProps, event) => {
      const promise = view.subscribed ?
        subscriptionStore.unsubscribe(view.subscriptionId) : subscriptionStore.subscribe(view.id);
      promise.then((subscribedResult) => {
        ownProps.onSubscriptionChange(_.get(subscribedResult, 'id'));
      }).
      catch(() => {
        ownProps.onSubscriptionChange();
      });
      event.preventDefault();
    },
    renderButtons(ownProps) {
      const {
        onClickGrid,
        onDownloadData,
        isDesktop,
        isTablet,
        isMobile,
        onWatchDatasetFlagClick,
        onSubscriptionChange
      } = ownProps;

      const childProps = {
        view,
        onClickGrid,
        onDownloadData,
        isDesktop,
        isTablet,
        isMobile,
        onWatchDatasetFlagClick,
        onSubscriptionChange
      };

      return <InfoPaneButtons {...childProps} />;
    }
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onClickGrid() {
      var payload = {
        name: 'Navigated to Gridpage'
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onClickVisualizeAndFilter(event) {
      var payload = {
        name: 'Navigated to Visualize And Filter',
        properties: {
          id: event.target.dataset.id
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onClickPlotly(event) {
      var payload = {
        name: 'Opened in Plot.ly',
        properties: {
          id: event.target.dataset.id
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onDownloadData(event) {
      var payload = {
        name: 'Downloaded Data',
        properties: {
          'Type': event.target.dataset.type
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onExpandDescription() {
      var payload = {
        name: 'Expanded Details',
        properties: {
          'Expanded Target': 'Description'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onSubscriptionChange(subscriptionId) {
      dispatch(subscriptionChange(subscriptionId));
    }
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(InfoPaneComponent);
