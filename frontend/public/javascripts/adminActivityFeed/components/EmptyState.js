import { fromJS } from 'immutable';
import React from 'react';
import connectLocalization from './Localization/connectLocalization';
import { connect } from 'react-redux';
import LocalizedText from './Localization/LocalizedText';

import './EmptyState.scss';

class EmptyState extends React.Component {
  // Don't re-render component if loading in progress.
  shouldComponentUpdate(nextProps) {
    return !nextProps.inLoadingStage;
  }

  getEmptyTableMessage() {
    const { localization } = this.props;

    const message = localization.translate('empty_message', {
      new_dataset_url: `${localization.getLocalePrefix()}/datasets/new`
    });

    return <div className="emptyState" dangerouslySetInnerHTML={{__html: message}} />;
  }

  getFilteredEmptyTableMessage() {
    return (
      <div className="emptyState">
        <LocalizedText localeKey='empty_message_filtered'/>
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

export default connectLocalization(connect(mapStateToProps)(EmptyState));
