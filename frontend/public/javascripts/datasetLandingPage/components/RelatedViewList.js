import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { CSSTransitionGroup } from 'react-transition-group';
import { connect } from 'react-redux';
import BootstrapAlert from './BootstrapAlert';
import { ViewCard } from 'common/components';
import { getViewCardPropsForView } from '../../common/helpers/viewCardHelpers';
import { RELATED_VIEWS_CHUNK_SIZE } from '../../common/constants';
import { handleKeyPress } from '../../common/a11yHelpers';
import { userHasRight } from '../../common/user';
import * as Rights from '../../common/rights';
import { emitMixpanelEvent } from '../actions/mixpanel';
import {
  loadMoreRelatedViews,
  dismissRelatedViewsError,
  toggleRelatedViews
} from '../actions/relatedViews';

export class RelatedViewList extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'onScrollList',
      'getHeight',
      'renderEmptyListAlert',
      'renderContents',
      'renderLoadMoreLink',
      'renderError',
      'renderCollapseLink'
    ]);
  }

  onScrollList(event) {
    const { isDesktop, hasMore, isLoading, loadMore } = this.props;

    if (isDesktop || !hasMore || isLoading) {
      return;
    }

    const el = event.target;
    const isAtRightEdge = ((el.scrollWidth - el.offsetWidth) - el.scrollLeft) < 200;

    if (isAtRightEdge) {
      loadMore();
    }
  }

  getHeight() {
    const { viewList, isCollapsed, isDesktop, isLoading } = this.props;

    if (_.isEmpty(viewList)) {
      return;
    }

    const relatedViewHeight = 297;
    const relatedViewMargin = 18;

    if (!isDesktop) {
      return {
        height: '100%'
      };
    }

    const visibleCount = isCollapsed ? RELATED_VIEWS_CHUNK_SIZE : viewList.length;
    let rowCount = Math.ceil(visibleCount / RELATED_VIEWS_CHUNK_SIZE);

    // While loading on desktop, we immediately expand the container to make room for the new views.
    if (isLoading) {
      rowCount += 1;
    }

    return (relatedViewHeight + relatedViewMargin) * rowCount - 1;
  }

  renderEmptyListAlert() {
    const { bootstrapUrl } = this.props;

    return <BootstrapAlert bootstrapUrl={bootstrapUrl} />;
  }

  renderContents() {
    const {
      viewList,
      hasMore,
      onClickWidget,
      isDesktop,
      isLoading
    } = this.props;

    if (userHasRight(Rights.edit_others_datasets) && _.isEmpty(viewList)) {
      return this.renderEmptyListAlert();
    }

    const relatedViews = _.map(viewList, (relatedView, i) => {
      return <ViewCard key={i} {...getViewCardPropsForView(relatedView)} onClick={onClickWidget} />;
    });

    if (!isDesktop && hasMore) {
      relatedViews.push(
        <div className="result-card loading-card" key="loading">
          <span className="spinner-default spinner-large" />
        </div>
      );
    }

    if (isDesktop && hasMore && isLoading) {
      relatedViews.push(
        <div className="desktop-spinner" key="loading">
          <span className="spinner-default spinner-large" />
        </div>
      );
    }

    const style = {
      height: this.getHeight()
    };

    return (
      <CSSTransitionGroup
        component="div"
        className="media-results related-views"
        style={style}
        onScroll={this.onScrollList}
        transitionName="related-views"
        transitionEnterTimeout={400}
        transitionLeaveTimeout={400}>
        {relatedViews}
      </CSSTransitionGroup>
    );
  }

  renderLoadMoreLink() {
    const { hasMore, isLoading, loadMore, isDesktop } = this.props;

    if (!hasMore || !isDesktop) {
      return null;
    }

    const clickHandler = isLoading ? null : loadMore;

    return (
      <a
        role="button"
        tabIndex="0"
        onClick={clickHandler}
        onKeyDown={handleKeyPress(clickHandler)}
        className="load-more-button">
        {I18n.more}
      </a>
    );
  }

  renderError() {
    const { hasError, dismissError } = this.props;

    if (!hasError) {
      return null;
    }

    return (
      <div className="alert error">
        {I18n.related_views.load_more_error}
        <span role="button" className="icon-close-2 alert-dismiss" onClick={dismissError}></span>
      </div>
    );
  }

  renderCollapseLink() {
    const { viewList, hasMore, isCollapsed, toggleList, isDesktop } = this.props;

    if (hasMore || viewList.length <= RELATED_VIEWS_CHUNK_SIZE || !isDesktop) {
      return null;
    }

    return (
      <a
        role="button"
        tabIndex="0"
        onClick={toggleList}
        onKeyDown={handleKeyPress(toggleList)}
        className="collapse-button">
        {isCollapsed ? I18n.more : I18n.less}
      </a>
    );
  }

  render() {
    const { viewList } = this.props;

    if (_.isEmpty(viewList) && !userHasRight(Rights.edit_others_datasets)) {
      return null;
    }

    return (
      <section className="landing-page-section related-views">
        <h2 className="dataset-landing-page-header">
          {I18n.related_views.title}
        </h2>

        {this.renderContents()}
        {this.renderLoadMoreLink()}
        {this.renderCollapseLink()}
        {this.renderError()}
      </section>
    );
  }
}

RelatedViewList.propTypes = {
  bootstrapUrl: PropTypes.string,
  dismissError: PropTypes.func.isRequired,
  hasError: PropTypes.bool.isRequired,
  hasMore: PropTypes.bool.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
  isDesktop: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  loadMore: PropTypes.func.isRequired,
  onClickWidget: PropTypes.func.isRequired,
  toggleList: PropTypes.func.isRequired,
  viewList: PropTypes.arrayOf(PropTypes.object).isRequired
};

function mapStateToProps(state) {
  return {
    bootstrapUrl: state.view.bootstrapUrl,
    ...state.relatedViews
  };
}

function mapDispatchToProps(dispatch) {
  return {
    loadMore() {
      dispatch(loadMoreRelatedViews());

      const mixpanelPayload = {
        name: 'Clicked to Show More Views'
      };

      dispatch(emitMixpanelEvent(mixpanelPayload));
    },

    toggleList() {
      dispatch(toggleRelatedViews());
    },

    dismissError() {
      dispatch(dismissRelatedViewsError());
    },

    onClickWidget(event) {
      const resultCard = $(event.target).closest('.result-card')[0];

      if (resultCard) {
        const payload = {
          name: 'Clicked a Related View',
          properties: {
            'Related View Id': resultCard.dataset.id,
            'Related View Type': resultCard.dataset.type
          }
        };

        dispatch(emitMixpanelEvent(payload));
      }
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(RelatedViewList);
