import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { formatDate } from 'common/dates';
import I18n from 'common/i18n';
import InfoPaneComponent from '../../common/components/InfoPaneComponent';
import InfoPaneButtons from './InfoPaneButtons';

function mapStateToProps(state) {
  const { view, isEphemeral } = state;
  const { hideDataSourceLink } = _.get(window, 'serverConfig.customConfigurations', {});

  const updatedDate = isEphemeral ?
    I18n.t('visualization_canvas.info_pane.unsaved') :
    formatDate(view.lastUpdatedAt);

  let footer = (
    <a href={state.parentView.path} target="_blank">
      {I18n.t('visualization_canvas.info_pane.based_on')}
      {' '}
      <em>{state.parentView.name}</em>
    </a>
  );
  if (hideDataSourceLink === 'true') {
    // See EN-17469.
    // Need to render *some* text in order to make borders look correct.
    footer = (<span>&nbsp;</span>);
  }

  return {
    name: view.name,
    description: view.description,
    provenance: null, // EN-12840 Remove official badge from vizcan
    category: view.category,
    isPaneCollapsible: true,
    footer,
    metadata: {
      first: {
        label: I18n.t('visualization_canvas.info_pane.updated'),
        content: updatedDate
      },
      second: {
        label: I18n.t('visualization_canvas.info_pane.view_count'),
        content: _.defaultTo(view.viewCount, 0)
      }
    },
    renderButtons() {
      return <InfoPaneButtons />;
    }
  };
}

export default connect(mapStateToProps)(InfoPaneComponent);
