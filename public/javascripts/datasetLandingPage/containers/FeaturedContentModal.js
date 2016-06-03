import { connect } from 'react-redux';
import FeaturedContentModal from '../components/FeaturedContentModal';
import { addFeaturedItem, editFeaturedItem, removeFeaturedItem } from '../actions';

function mapStateToProps(state) {
  return state.featuredContent;
}

function mapDispatchToProps() {
  return {
    onClickAddFeaturedItem: function(event) {
      var dataAttributes = event.target.dataset;
      addFeaturedItem(dataAttributes.position, dataAttributes.contentType);
    },

    onClickEditFeaturedItem: function(event) {
      editFeaturedItem(event.target.dataset.position);
    },

    onClickRemoveFeaturedItem: function(event) {
      removeFeaturedItem(event.target.dataset.position);
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(FeaturedContentModal);
