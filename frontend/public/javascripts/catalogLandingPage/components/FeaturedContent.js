import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import FeaturedContentViewCard from './FeaturedContentViewCard';
import { getViewCardPropsForCLPFeaturedItem } from '../../common/helpers/viewCardHelpers';

export class FeaturedContent extends React.Component {
  render() {
    const { featuredContent } = this.props;

    const featuredContentViewCards = _(featuredContent).
      sortBy('position').
      map(getViewCardPropsForCLPFeaturedItem).
      map((props, index) => (<FeaturedContentViewCard key={index} {...props} />)).
      value();

    return (featuredContentViewCards.length === 0) ? null : (
      <section className="landing-page-section featured-content">
        <h2 className="landing-page-section-header">
          {_.get(I18n, 'featured_content.label')}
        </h2>
        <div className="media-results">
          {featuredContentViewCards}
        </div>
      </section>
    );
  }
}

FeaturedContent.propTypes = {
  featuredContent: PropTypes.shape({
    item0: PropTypes.shape({
      contentType: PropTypes.string,
      createdAt: PropTypes.number,
      description: PropTypes.string,
      displayType: PropTypes.string,
      id: PropTypes.number,
      isPrivate: PropTypes.bool,
      name: PropTypes.string,
      position: PropTypes.number,
      rowsUpdatedAt: PropTypes.number,
      uid: PropTypes.string,
      updatedAt: PropTypes.string,
      url: PropTypes.string,
      viewCount: PropTypes.number
    }),
    item1: PropTypes.object,
    item2: PropTypes.object
  }).isRequired
};

const mapStateToProps = (state) => ({ featuredContent: state.featuredContent });

export default connect(mapStateToProps)(FeaturedContent);
