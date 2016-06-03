import { connect } from 'react-redux';
import FeaturedContent from '../components/FeaturedContent';

function mapStateToProps(state) {
  return state.featuredContent;
}

export default connect(mapStateToProps)(FeaturedContent);
