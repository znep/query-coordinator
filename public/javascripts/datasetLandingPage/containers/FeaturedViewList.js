import _ from 'lodash';
import { connect } from 'react-redux';
import FeaturedViewList from '../components/FeaturedViewList';

function mapStateToProps(state) {
  return _.pick(state, 'featuredViews');
}

var FeaturedViewListContainer = connect(mapStateToProps)(FeaturedViewList);

export default FeaturedViewListContainer;
