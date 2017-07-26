import React from 'react';
import { connect } from 'react-redux';
import formatDate from '../../common/formatDate';
import { emitMixpanelEvent } from '../actions/mixpanel';
import InfoPaneButtons from './InfoPaneButtons';
import InfoPaneComponent from '../../common/components/InfoPaneComponent.js';

function mapStateToProps(state) {
  const { view } = state;

  const attribution = view.attribution ?
    { label: I18n.published_by, content: view.attribution } :
    null;

  return {
    name: view.name,
    description: view.description,
    category: view.category,
    provenance: view.provenance,
    isPrivate: view.isPrivate,
    metadata: {
      first: {
        label: I18n.common.updated,
        content: formatDate(view.lastUpdatedAt)
      },
      second: attribution
    },
    renderButtons(ownProps) {
      const { onClickGrid, onDownloadData, isDesktop, isTablet, isMobile } = ownProps;

      const childProps = {
        view,
        onClickGrid,
        onDownloadData,
        isDesktop,
        isTablet,
        isMobile
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
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(InfoPaneComponent);
