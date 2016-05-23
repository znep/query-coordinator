import _ from 'lodash';
import React, { PropTypes } from 'react';
import ViewWidget from './ViewWidget';
import { VelocityComponent } from 'velocity-react';
import { POPULAR_VIEWS_CHUNK_SIZE } from '../lib/constants';

export var PopularViewList = React.createClass({
  propTypes: {
    dismissError: PropTypes.func,
    hasError: PropTypes.bool,
    hasMore: PropTypes.bool,
    isLoading: PropTypes.bool,
    isCollapsed: PropTypes.bool,
    list: PropTypes.arrayOf(PropTypes.object).isRequired,
    loadMore: PropTypes.func,
    onScrollList: PropTypes.func,
    toggleList: PropTypes.func
  },

  renderContents: function() {
    var { list, hasMore, isCollapsed, onClickWidget, onScrollList, isDesktop } = this.props;

    if (_.isEmpty(list)) {
      var alertMessage = I18n.popular_views.no_content_alert_html;
      return <div className="alert default" dangerouslySetInnerHTML={{__html: alertMessage}} />;
    }

    var popularViews = _.map(list, function(popularView, i) {
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

    if (isDesktop && hasMore) {
      popularViews.push(
        <div className="desktop-spinner" key="loading">
          <span className="spinner-default spinner-large" />
        </div>
      );
    }

    return (
      <div className="media-results" onScroll={onScrollList}>
        {popularViews}
      </div>
    );
  },

  renderLoadMoreLink: function() {
    var { hasMore, isLoading, loadMore, isDesktop } = this.props;

    if (!hasMore || !isDesktop) {
      return null;
    }

    return <a onClick={isLoading ? null : loadMore} className="load-more-button">{I18n.more}</a>;
  },

  renderError: function() {
    var { hasError, dismissError } = this.props;

    if (!hasError) {
      return;
    }

    return (
      <div className="alert error">
        {I18n.popular_views.load_more_error}
        <span className="icon-close-2 alert-dismiss" onClick={dismissError}></span>
      </div>
    );
  },

  renderCollapseLink: function() {
    var { list, hasMore, isCollapsed, toggleList, isDesktop } = this.props;

    if (hasMore || list.length <= POPULAR_VIEWS_CHUNK_SIZE || !isDesktop) {
      return;
    }

    return (
      <a onClick={toggleList} className="collapse-button">
        {isCollapsed ? I18n.more : I18n.less}
      </a>
    );
  },

  getAnimation: function() {
    var { list, isCollapsed, isDesktop, isLoading } = this.props;

    var popularViewHeight = 287;
    var popularViewMargin = 18;

    if (!isDesktop) {
      return {
        height: '100%'
      };
    }

    var visibleCount = isCollapsed ? POPULAR_VIEWS_CHUNK_SIZE : list.length;
    var rowCount = Math.ceil(visibleCount / POPULAR_VIEWS_CHUNK_SIZE);

    // While loading on desktop, we immediately expand the container to make room for the new views.
    if (isLoading) {
      rowCount += 1;
    }

    return {
      height: (popularViewHeight + popularViewMargin) * rowCount - 1
    };
  },

  render: function() {
    return (
      <section className="landing-page-section metadata">
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

export default PopularViewList;
