import _ from 'lodash';
import { connect } from 'react-redux';
import PopularViewList from '../components/PopularViewList';
import breakpoints from '../lib/breakpoints';
import {
  emitMixpanelEvent,
  loadMorePopularViews,
  dismissPopularViewsError,
  togglePopularViews
} from '../actions';

function mapStateToProps(state) {
  return state.popularViews;
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
