import React from 'react';
import { connect } from 'react-redux';
import formatDate from '../lib/formatDate';
import { emitMixpanelEvent } from '../actions/mixpanel';
import components from 'socrata-components';
import InfoPaneButtons from './InfoPaneButtons';

function mapStateToProps(state) {
  const { view } = state;

  const attribution = view.attribution ?
    { label: I18n.published_by, content: view.attribution } :
    null;

  return {
    name: view.name,
    description: view.description,
    category: view.category,
    isOfficial: true,
    isPrivate: view.isPrivate,
    metadata: {
      first: {
        label: I18n.updated,
        content: formatDate(view.lastUpdatedAt)
      },
      second: attribution
    },
    renderButtons(ownProps) {
      const { onClickGrid, onDownloadData } = ownProps;

      const childProps = {
        view,
        onClickGrid,
        onDownloadData
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
          'Expanded Target': 'Descripton'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(components.InfoPane);
