import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { VelocityComponent } from 'velocity-react';
import BootstrapAlert from './BootstrapAlert';
import ViewWidget from './ViewWidget';
import { POPULAR_VIEWS_CHUNK_SIZE } from '../lib/constants';
import { handleKeyPress } from '../lib/a11yHelpers';
import { isUserAdminOrPublisher } from '../lib/user';
import { emitMixpanelEvent } from '../actions/mixpanel';
import {
  loadMorePopularViews,
  dismissPopularViewsError,
  togglePopularViews
} from '../actions/popularViews';

export var PopularViewList = React.createClass({
  propTypes: {
    bootstrapUrl: PropTypes.string,
    dismissError: PropTypes.func.isRequired,
    hasError: PropTypes.bool.isRequired,
    hasMore: PropTypes.bool.isRequired,
    isCollapsed: PropTypes.bool.isRequired,
    isDesktop: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    loadMore: PropTypes.func.isRequired,
    onClickWidget: PropTypes.func.isRequired,
    onScrollList: PropTypes.func.isRequired,
    toggleList: PropTypes.func.isRequired,
    viewList: PropTypes.arrayOf(PropTypes.object).isRequired
  },

  getAnimation: function() {
    var { viewList, isCollapsed, isDesktop, isLoading } = this.props;

    if (_.isEmpty(viewList)) {
      return;
    }

    var popularViewHeight = 284;
    var popularViewMargin = 18;

    if (!isDesktop) {
      return {
        height: '100%'
      };
    }

    var visibleCount = isCollapsed ? POPULAR_VIEWS_CHUNK_SIZE : viewList.length;
    var rowCount = Math.ceil(visibleCount / POPULAR_VIEWS_CHUNK_SIZE);

    // While loading on desktop, we immediately expand the container to make room for the new views.
    if (isLoading) {
      rowCount += 1;
    }

    return {
      height: (popularViewHeight + popularViewMargin) * rowCount - 1
    };
  },

  renderEmptyListAlert: function() {
    var { bootstrapUrl } = this.props;

    return <BootstrapAlert bootstrapUrl={bootstrapUrl} />;
  },

  renderContents: function() {
    var {
      viewList,
      hasMore,
      isCollapsed,
      onClickWidget,
      onScrollList,
      isDesktop,
      isLoading
    } = this.props;

    if (isUserAdminOrPublisher() && _.isEmpty(viewList)) {
      return this.renderEmptyListAlert();
    }

    var popularViews = _.map(viewList, function(popularView, i) {
      var opacity;

      if (isDesktop) {
        opacity = (i > 2 && isCollapsed) ? 0 : 1;
      } else {
        opacity = 1;
      }

      var animation = { opacity: opacity };

      return (
        <VelocityComponent key={i} animation={animation} runOnMount={i > 2} duration={400}>
          <ViewWidget {...popularView} onClick={onClickWidget} />
        </VelocityComponent>
      );
    });

    if (!isDesktop && hasMore) {
      popularViews.push(
        <div className="result-card loading-card" key="loading">
          <span className="spinner-default spinner-large" />
        </div>
      );
    }

    if (isDesktop && hasMore && isLoading) {
      popularViews.push(
        <div className="desktop-spinner" key="loading">
          <span className="spinner-default spinner-large" />
        </div>
      );
    }

    return (
      <div className="media-results popular-views" onScroll={onScrollList}>
        {popularViews}
      </div>
    );
  },

  renderLoadMoreLink: function() {
    var { hasMore, isLoading, loadMore, isDesktop } = this.props;

    if (!hasMore || !isDesktop || !serverConfig.featureFlags.defaultToDatasetLandingPage) {
      return null;
    }

    var clickHandler = isLoading ? null : loadMore;

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
  },

  renderError: function() {
    var { hasError, dismissError } = this.props;

    if (!hasError) {
      return;
    }

    return (
      <div className="alert error">
        {I18n.popular_views.load_more_error}
        <span role="button" className="icon-close-2 alert-dismiss" onClick={dismissError}></span>
      </div>
    );
  },

  renderCollapseLink: function() {
    var { viewList, hasMore, isCollapsed, toggleList, isDesktop } = this.props;

    if (hasMore || viewList.length <= POPULAR_VIEWS_CHUNK_SIZE || !isDesktop) {
      return;
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
  },

  render: function() {
    var { viewList } = this.props;

    if (_.isEmpty(viewList) && !isUserAdminOrPublisher()) {
      return null;
    }

    return (
      <section className="landing-page-section popular-views">
        <h2 className="dataset-landing-page-header">
          {I18n.popular_views.title}
        </h2>

        <VelocityComponent animation={this.getAnimation()}>
          {this.renderContents()}
        </VelocityComponent>

        {this.renderLoadMoreLink()}
        {this.renderCollapseLink()}
        {this.renderError()}
      </section>
    );
  }
});

function mapStateToProps(state) {
  return {
    bootstrapUrl: state.view.bootstrapUrl,
    ...state.popularViews
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    loadMore: function() {
      dispatch(loadMorePopularViews());

      var mixpanelPayload = {
        name: 'Clicked to Show More Views'
      };

      dispatch(emitMixpanelEvent(mixpanelPayload));
    },

    toggleList: function() {
      dispatch(togglePopularViews());
    },

    dismissError: function() {
      dispatch(dismissPopularViewsError());
    },

    onClickWidget: function(event) {
      var resultCard = event.target.closest('.result-card');
      var payload = {
        name: 'Clicked a Related View',
        properties: {
          'Related View Id': resultCard.dataset.id,
          'Related View Type': resultCard.dataset.type
        }
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onScrollList: _.throttle(function(event) {
      var el = event.target;
      var isDesktop = ownProps.isDesktop;
      var hasMore = event.target.querySelector('.loading-card');
      var isAtRightEdge = ((el.scrollWidth - el.offsetWidth) - el.scrollLeft) < 200;

      if (!isDesktop && hasMore && isAtRightEdge) {
        dispatch(loadMorePopularViews());
      }
    }, 200)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PopularViewList);
