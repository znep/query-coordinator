import _ from 'lodash';
import React, { PropTypes } from 'react';
import FeaturedView from './FeaturedView';
import { VelocityComponent } from 'velocity-react';

export var FeaturedViewList = React.createClass({
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
    var { list, hasMore, onClickWidget, onScrollList, isDesktop } = this.props;

    if (_.isEmpty(list)) {
      var alertMessage = I18n.featured_views.no_content_alert_html;
      return <div className="alert default" dangerouslySetInnerHTML={{__html: alertMessage}} />;
    }

    var featuredViews = _.map(list, function(featuredView, i) {
      var animation = { opacity: 1 };

      return (
        <VelocityComponent key={i} animation={animation} runOnMount={i > 2}>
          <FeaturedView {...featuredView} onClick={onClickWidget} />
        </VelocityComponent>
      );
    });

    if (!isDesktop && hasMore) {
      featuredViews.push(
        <div className="result-card loading-card" key="loading">
          <span className="spinner-default" />
        </div>
      );
    }

    return (
      <div className="media-results" onScroll={onScrollList}>
        {featuredViews}
      </div>
    );
  },

  renderLoadMoreButton: function() {
    var { hasMore, hasError, isLoading, loadMore, dismissError, isDesktop } = this.props;

    if (!hasMore || !isDesktop) {
      return null;
    }

    var contents = isLoading ?
     <span className="spinner-default spinner-btn-default spinner-btn-sm" /> : I18n.more;

    var onClick = isLoading ? null : loadMore;
    var className = 'btn btn-default btn-sm load-more-button';

    // Keep button height the same regardless of whether or not it has a spinner inside of it.
    var style = isLoading ? { paddingTop: '6px', paddingBottom: '3px' } : null;

    var errorAlert;
    if (hasError) {
      errorAlert = (
        <div className="alert error">
          {I18n.featured_views.load_more_error}
          <span className="icon-close-2 alert-dismiss" onClick={dismissError}></span>
        </div>
      );
    }

    return (
      <div>
        <button onClick={onClick} className={className} style={style}>
          {contents}
        </button>

        {errorAlert}
      </div>
    );
  },

  renderCollapseButton: function() {
    var { list, hasMore, isCollapsed, toggleList, isDesktop } = this.props;

    if (hasMore || list.length <= 3 || !isDesktop) {
      return;
    }

    return (
      <button onClick={toggleList} className="btn btn-default btn-sm collapse-button">
        {isCollapsed ? I18n.more : I18n.less}
      </button>
    );
  },

  getAnimation: function() {
    var { list, isCollapsed, isDesktop } = this.props;

    var featuredViewHeight = 287;
    var featuredViewMargin = 18;

    if (!isDesktop) {
      return {
        height: '100%'
      };
    }

    var visibleCount = isCollapsed ? 3 : list.length;

    return {
      height: (featuredViewHeight + featuredViewMargin) * Math.ceil(visibleCount / 3)
    };
  },

  render: function() {
    return (
      <section className="landing-page-section metadata">
        <h2 className="dataset-landing-page-header">
          {I18n.featured_views.title}
        </h2>

        <VelocityComponent animation={this.getAnimation()}>
          {this.renderContents()}
        </VelocityComponent>

        {this.renderLoadMoreButton()}
        {this.renderCollapseButton()}
      </section>
    );
  }
});

export default FeaturedViewList;
