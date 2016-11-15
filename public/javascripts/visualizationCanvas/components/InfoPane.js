import _ from 'lodash';
import components from 'socrata-components';
import { formatDate } from 'socrata-components/common/dates';
import { translate as t } from '../lib/I18n';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  const { view } = state;

  const updatedDate = _.isString(view.lastUpdatedAt) ?
    formatDate(view.lastUpdatedAt) :
    t('info_pane.unsaved');

  const basedOnHtml = t('info_pane.based_on').replace('%{name}', state.parentView.name);
  // TODO can this be JSX?  Need to update InfoPane
  const footer = `<a href=${state.parentView.url} target="_blank">${basedOnHtml}</a>`;

  return {
    name: view.name,
    description: view.description,
    isOfficial: true,
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

export default connect(mapStateToProps)(components.InfoPane);
