import _ from 'lodash';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import Pager from 'frontend/public/javascripts/common/components/Pager';
import DownloadLink from './DownloadLink';
import * as actions from '../actions';
import utils from 'common/js_utils';
import LocalizedText from 'common/i18n/components/LocalizedText';

import PropTypes from 'prop-types';

class Footer extends PureComponent {
  renderPager() {
    const { changePage, page, pageSize, rowCount } = this.props;

    const pagerProps = {
      changePage,
      currentPage: page,
      resultCount: rowCount,
      resultsPerPage: pageSize
    };

    return <Pager {...pagerProps} />;
  }

  renderResultCount() {
    const { page, pageSize, rowCount } = this.props;

    const first = (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, rowCount);
    const count = utils.formatNumber(rowCount);
    const textProps = { first, last, count };

    const translationKey = rowCount > 1 ?
      'screens.admin.activity_feed.result_count.other' :
      'screens.admin.activity_feed.result_count.one';

    const resultCountText = (rowCount > 0) ?
      <LocalizedText localeKey={translationKey} data={textProps} /> :
      <LocalizedText localeKey="screens.admin.activity_feed.no_results" />;

    return (
      <div className="result-count">
        {resultCountText}
      </div>
    );
  }

  render() {
    return (
      <div className="catalog-footer">
        <div className="pagination-and-result-count">
          {this.renderPager()}
          {this.renderResultCount()}
        </div>
        <DownloadLink />
      </div>
    );
  }
}

Footer.defaultProps = {
  changePage: _.noop
};

Footer.propTypes = {
  changePage: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  page: state.pagination.page,
  pageSize: state.pagination.pageSize,
  rowCount: state.pagination.rowCount
});

const mapDispatchToProps = dispatch => ({
  changePage: page => dispatch(actions.pagination.changePage(page))
});

export default connect(mapStateToProps, mapDispatchToProps)(Footer);
