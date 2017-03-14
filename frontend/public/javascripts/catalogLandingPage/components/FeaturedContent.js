import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { ExternalViewCard, ViewCard } from 'socrata-components';

import { getIconClassForDisplayType } from 'socrata-components/common/displayTypeMetadata';
import { getDateLabel, getViewCountLabel, getAriaLabel } from '../../common/helpers/viewCardHelpers';

const FeaturedContent = (props) => {
  var { featuredContent } = props;

  const viewCardProps = (item) => {
    if (item.contentType === 'external') {
      return {
        name: item.title,
        description: item.description,
        url: item.url,
        metadataLeft: _.get(I18n, 'view_card.external_content', 'External Content'),
        metadataRight: getViewCountLabel(item.viewCount),
        imageUrl: item.previewImageUrl,
        linkProps: {
          'aria-label': getAriaLabel(item)
        }
      };
    } else {
      return {
        name: item.title,
        description: item.description,
        url: item.url,
        icon: getIconClassForDisplayType(item.displayType),
        metadataLeft: getDateLabel(item.rowsUpdatedAt),
        metadataRight: getViewCountLabel(item.viewCount),
        imageUrl: item.previewImageUrl,
        isPrivate: item.isPrivate,
        linkProps: {
          target: '_blank',
          'aria-label': getAriaLabel(item)
        }
      };
    }
  };

  const viewCard = (item) => {
    if (item.contentType === 'internal') {
      return <ViewCard key={item.id} {...viewCardProps(item)} />;
    } else {
      return <ExternalViewCard key={item.id} {...viewCardProps(item)} />;
    }
  };

  return (
    <section className="landing-page-section featured-content">
      <h2 className="landing-page-section-header">Featured Content in this Category</h2>
      <div className="media-results">
        {_.map(featuredContent, (item) => viewCard(item))}
      </div>
    </section>
  );
};

FeaturedContent.propTypes = {
  featuredContent: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({ featuredContent: state.featuredContent });

export default connect(mapStateToProps)(FeaturedContent);
