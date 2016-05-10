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

function mapDispatchToProps(dispatch) {
  return {
    loadMore: function() {
      dispatch(loadMoreFeaturedViews());
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
      var isDesktop = document.body.offsetWidth > breakpoints.tablet;
      var hasMore = event.target.querySelector('.loading-card');
      var isAtRightEdge = ((el.scrollWidth - el.offsetWidth) - el.scrollLeft) < 200;

      if (!isDesktop && hasMore && isAtRightEdge) {
        dispatch(loadMoreFeaturedViews());
      }
    }, 200)
  };
}

var FeaturedViewListContainer = connect(mapStateToProps, mapDispatchToProps)(FeaturedViewList);

export default FeaturedViewListContainer;
