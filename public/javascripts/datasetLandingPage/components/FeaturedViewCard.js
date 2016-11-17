import React, { PropTypes } from 'react';
import { ViewCard, ExternalViewCard } from 'socrata-components';
import { getViewCardPropsForFeaturedItem } from '../lib/viewCardHelpers';

const FeaturedViewCard = (props) => {
  const { children, featuredItem } = props;

  const cardProps = getViewCardPropsForFeaturedItem(featuredItem);

  if (featuredItem.contentType === 'external') {
    return <ExternalViewCard {...cardProps}>{children}</ExternalViewCard>;
  } else if (featuredItem.contentType === 'internal') {
    return <ViewCard {...cardProps}>{children}</ViewCard>;
  }
};

FeaturedViewCard.propTypes = {
  children: PropTypes.node,
  featuredItem: PropTypes.object
};

export default FeaturedViewCard;
