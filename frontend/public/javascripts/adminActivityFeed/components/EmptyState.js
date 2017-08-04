import { fromJS } from 'immutable';
import React from 'react';
import { connect } from 'react-redux';
import I18n from 'common/i18n';
import LocalizedText from 'common/i18n/components/LocalizedText';

import './EmptyState.scss';

class EmptyState extends React.Component {
  // Don't re-render component if loading in progress.
  shouldComponentUpdate(nextProps) {
    return !nextProps.inLoadingStage;
  }

  getEmptyTableMessage() {
    const messageData = {
      new_dataset_url: `${I18n.locale}/datasets/new`
    };

    return (
      <div className='emptyState'>
        <LocalizedText localeKey='screens.admin.jobs.empty_message' data={messageData}/>
      </div>
    );
  }

  getFilteredEmptyTableMessage() {
    return (
      <div className='emptyState'>
        <LocalizedText localeKey='screens.admin.jobs.empty_message_filtered'/>
      </div>
    );
  }

  renderMessage() {
    return this.props.isNotFiltered ?
      this.getEmptyTableMessage() :
      this.getFilteredEmptyTableMessage();
  }

  render() {
    return this.props.isStateEmpty ? this.renderMessage() : null;
  }
}

const mapStateToProps = (state) => {
  const filtersEmptyState = {event: 'All', status: 'All', dateFrom: null, dateTo: null};
  const isNotFiltered = state.get('filter').equals(fromJS(filtersEmptyState));
  const inLoadingStage = state.get('loading');

  return {
    isStateEmpty: state.get('activities').count() === 0,
    isNotFiltered,
    inLoadingStage
  };
};

export default connect(mapStateToProps)(EmptyState);
