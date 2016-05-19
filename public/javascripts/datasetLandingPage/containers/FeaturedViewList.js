import _ from 'lodash';
import { connect } from 'react-redux';
import FeaturedViewList from '../components/FeaturedViewList';
import breakpoints from '../lib/breakpoints';
import {
  emitMixpanelEvent,
  loadMoreFeaturedViews,
  dismissFeaturedViewsError,
  toggleFeaturedViews
} from '../actions';

function mapStateToProps(state) {
  return state.featuredViews;
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    loadMore: function() {
      dispatch(loadMoreFeaturedViews());

      var mixpanelPayload = {
        name: 'Clicked to Show More Views'
      };

      dispatch(emitMixpanelEvent(mixpanelPayload));
    },

    toggleList: function() {
      dispatch(toggleFeaturedViews());
    },

    dismissError: function() {
      dispatch(dismissFeaturedViewsError());
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
        dispatch(loadMoreFeaturedViews());
      }
    }, 200)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(FeaturedViewList);
