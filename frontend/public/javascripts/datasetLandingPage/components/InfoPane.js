import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { formatDateWithLocale } from 'common/dates';
import { emitMixpanelEvent } from '../actions/mixpanel';
import InfoPaneButtons from './InfoPaneButtons';
import InfoPaneComponent from '../../common/components/InfoPaneComponent.js';
import subscriptionStore from 'datasetLandingPage/store/subscriptionStore';
import { onSubscriptionChange as subscriptionChange } from '../actions/view';
import { FeatureFlags } from 'common/feature_flags';

export function mapStateToProps(state) {
  const { view } = state;

  const attribution = view.attribution ?
    { label: I18n.published_by, content: view.attribution } :
    null;

  const userNotificationsEnabled = FeatureFlags.value('enable_user_notifications') === true;
  const hideDates = FeatureFlags.value('hide_dates_on_primer_and_data_catalog') === true;

  const metadataValues = [];
  if (!hideDates) {
    metadataValues.push(
      {
        label: I18n.common.updated,
        content: formatDateWithLocale(view.lastUpdatedAt)
      }
    );
  }
  metadataValues.push(attribution);

  const metadata = {
    first: metadataValues.shift(),
    second: metadataValues.shift()
  };

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
    metadata,
    onWatchDatasetFlagClick: (ownProps, event) => {
      const promise = view.subscribed ?
        subscriptionStore.unsubscribe(view.subscriptionId) : subscriptionStore.subscribe(view.id);
      promise.then((subscribedResult) => {
        ownProps.onSubscriptionChange(_.get(subscribedResult, 'id', null));
      }).
      catch(() => {
        ownProps.onSubscriptionChange(null);
      });
      event.preventDefault();
    },
    renderButtons(ownProps) {
      const {
        onClickCopy,
        onClickGrid,
        onClickShareOption,
        onDownloadData,
        isDesktop,
        isTablet,
        isMobile,
        onWatchDatasetFlagClick,
        onSubscriptionChange
      } = ownProps;

      const childProps = {
        view,
        onClickCopy,
        onClickGrid,
        onClickShareOption,
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
    onClickCopy(section) {
      const payload = {
        name: `Copied ${section} Link`
      };

      dispatch(emitMixpanelEvent(payload));
    },

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

    onClickShareOption(provider) {
      const payload = {
        name: 'Shared Dataset',
        properties: {
          'Provider': provider
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
