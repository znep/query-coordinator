import React, { PropTypes } from 'react';
import { ViewCard, ExternalViewCard } from 'socrata-components';
import { getViewCardPropsForFeaturedItem } from '../lib/viewCardHelpers';

var FeaturedViewCard = function(props) {
  var { children, featuredItem } = props;

  var cardProps = getViewCardPropsForFeaturedItem(featuredItem);

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
