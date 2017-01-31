import _ from 'lodash';
import React from 'react';
import { formatDate } from 'socrata-components/common/dates';
import { t } from '../lib/I18n';
import { connect } from 'react-redux';
import InfoPaneComponent from '../../common/components/InfoPaneComponent.js';

function mapStateToProps(state) {
  const { view } = state;

  const updatedDate = _.isString(view.lastUpdatedAt) ?
    formatDate(view.lastUpdatedAt) :
    t('info_pane.unsaved');

  const basedOnHtml = t('info_pane.based_on').replace('%{name}', state.parentView.name);

  const footer = (
    <a href={state.parentView.url} target="_blank" dangerouslySetInnerHTML={{ __html: basedOnHtml }}></a>
  );

  return {
    name: view.name,
    description: view.description,
    provenance: null, // EN-12840 Remove official badge from vizcan
    category: view.category,
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
    }
  };
}

export default connect(mapStateToProps)(InfoPaneComponent);
