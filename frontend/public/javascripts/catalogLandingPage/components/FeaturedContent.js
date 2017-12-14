import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import FeaturedContentViewCard from './FeaturedContentViewCard';
import HelpFlyout from './HelpFlyout';
import { getViewCardPropsForCLPFeaturedItem } from 'common/viewCardHelpers';

export class FeaturedContent extends React.Component {
  render() {
    const {
      catalogQuery,
      featuredContent,
      onFeaturedContentItemClick,
      onFeaturedContentRendered
    } = this.props;

    const featuredContentViewCards = _(featuredContent).
      sortBy('position').
      map(getViewCardPropsForCLPFeaturedItem).
      map((props, index) => (
        <FeaturedContentViewCard
          key={index}
          onClick={() => { onFeaturedContentItemClick(props.name, catalogQuery); }}
          {...props} />
      )).
      value();

    if (featuredContentViewCards.length === 0) {
      return null;
    } else {
      onFeaturedContentRendered(catalogQuery);

      const helpFlyout = window.serverConfig.currentUserMayManage ?
        <HelpFlyout right text={_.get(I18n, 'activation.whats_this')} /> : null;

      return (
        <section className="landing-page-section featured-content">
          <h2 className="landing-page-section-header">
            {_.get(I18n, 'featured_content.label_no_filter')}
            {helpFlyout}
          </h2>
          <div className="media-results">
            {featuredContentViewCards}
          </div>
        </section>
      );
    }
  }
}

FeaturedContent.propTypes = {
  catalogQuery: PropTypes.object,
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
  }).isRequired,
  onFeaturedContentItemClick: PropTypes.func.isRequired,
  onFeaturedContentRendered: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  catalogQuery: state.catalog.query,
  featuredContent: state.featuredContent
});

const mapDispatchToProps = (dispatch) => ({
  onFeaturedContentItemClick: (cardTitle, catalogQuery) => {
    dispatch(emitMixpanelEvent({
      name: 'Catalog Landing Page - Featured Content item clicked',
      cardTitle,
      catalogQuery
    }));
  },
  onFeaturedContentRendered: (catalogQuery) => {
    dispatch(emitMixpanelEvent({
      name: 'Catalog Landing Page - Featured Content rendered',
      catalogQuery
    }));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(FeaturedContent);
