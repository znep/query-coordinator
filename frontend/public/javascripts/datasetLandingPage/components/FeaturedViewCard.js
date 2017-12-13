import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { ViewCard, ExternalViewCard } from 'common/components';
import { getViewCardPropsForFeaturedItem } from 'common/viewCardHelpers';

class FeaturedViewCard extends PureComponent {
  render() {
    const { children, featuredItem } = this.props;

    const cardProps = getViewCardPropsForFeaturedItem(featuredItem);

    if (featuredItem.contentType === 'external') {
      return <ExternalViewCard {...cardProps}>{children}</ExternalViewCard>;
    } else if (featuredItem.contentType === 'internal') {
      return <ViewCard {...cardProps}>{children}</ViewCard>;
    }
  }
}

FeaturedViewCard.propTypes = {
  children: PropTypes.node,
  featuredItem: PropTypes.object
};

export default FeaturedViewCard;
