import React from 'react';
import { connect } from 'react-redux';

import LocalizedText from 'common/i18n/components/LocalizedText';
import Pagination from './Pagination';
import * as actions from '../actions';

class ActivityFeedPagination extends React.Component {
  render() {
    const { currentPage, hasNextPage, hasPreviousPage, onGotoPage, disabled } = this.props;

    if (hasNextPage || hasPreviousPage) {
      const previousButtonText = <LocalizedText localeKey='screens.admin.jobs.pagination.previous'/>;
      const nextButtonText = <LocalizedText localeKey='screens.admin.jobs.pagination.next'/>;

      return (
        <Pagination
          currentPage={currentPage}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          onGotoPage={onGotoPage}
          nextButtonText={nextButtonText}
          previousButtonText={previousButtonText}
          disabled={disabled}
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
    hasPreviousPage: pagination.get('hasPreviousPage'),
    disabled: state.get('loading')
  };
};

const mapDispatchToProps = (dispatch) => ({
  onGotoPage: (pageNumber) => dispatch(actions.gotoPage(pageNumber))
});

export default connect(mapStateToProps, mapDispatchToProps)(ActivityFeedPagination);

