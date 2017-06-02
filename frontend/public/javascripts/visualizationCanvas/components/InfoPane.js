import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { formatDate } from 'common/dates';
import { t } from '../lib/I18n';
import InfoPaneComponent from '../../common/components/InfoPaneComponent.js';
import InfoPaneButtons from './InfoPaneButtons';

function mapStateToProps(state) {
  const { view, isEphemeral } = state;

  const updatedDate = isEphemeral ? t('info_pane.unsaved') : formatDate(view.lastUpdatedAt);
  const footer = (
    <a href={state.parentView.path} target="_blank">
      {t('info_pane.based_on')}
      {' '}
      <em>{state.parentView.name}</em>
    </a>
  );

  return {
    name: view.name,
    description: view.description,
    provenance: null, // EN-12840 Remove official badge from vizcan
    category: view.category,
    isPaneCollapsible: true,
    footer,
    metadata: {
      first: {
        label: t('info_pane.updated'),
        content: updatedDate
      },
      second: {
        label: t('info_pane.view_count'),
        content: _.defaultTo(view.viewCount, 0)
      }
    },
    renderButtons() {
      return <InfoPaneButtons />;
    }
  };
}

export default connect(mapStateToProps)(InfoPaneComponent);
