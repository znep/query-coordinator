import React from 'react';
import { connect } from 'react-redux';

import connectLocalization from './Localization/connectLocalization';
import Pagination from './Pagination';
import * as actions from '../actions';

class ActivityFeedPagination extends React.Component {
  render() {
    const { currentPage, hasNextPage, hasPreviousPage, onGotoPage, localization } = this.props;

    if (hasNextPage || hasPreviousPage) {
      return (
        <Pagination
          currentPage={currentPage}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          onGotoPage={onGotoPage}
          nextButtonText={localization.translate('pagination.next')}
          previousButtonText={localization.translate('pagination.previous')}
          />
      );
    }

    return null;
  }
}

const mapStateToProps = (state) => {
  const pagination = state.get('pagination');

  return {
    currentPage: pagination.get('currentPage'),
    hasNextPage: pagination.get('hasNextPage'),
    hasPreviousPage: pagination.get('hasPreviousPage')
  };
};

const mapDispatchToProps = (dispatch) => ({
  onGotoPage: (pageNumber) => dispatch(actions.gotoPage(pageNumber))
});

export default connect(mapStateToProps, mapDispatchToProps)(connectLocalization(ActivityFeedPagination));

