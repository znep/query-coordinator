import React, { Component, PropTypes } from 'react';
import { ViewCard } from 'socrata-components';
import { getIconClassForDisplayType } from 'socrata-components/common/displayTypeMetadata';
import { getDateLabel, getViewCountLabel, getAriaLabel } from '../../datasetLandingPage/lib/viewCardHelpers';

export class Card extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['viewCardProps']);
  }

  viewCardProps() {

    return {
      name: this.props.name,
      description: this.props.description,
      url: this.props.link,
      icon: getIconClassForDisplayType(this.props.type),
      metadataLeft: getDateLabel(this.props.updatedAt),
      metadataRight: getViewCountLabel(this.props.viewCount),
      imageUrl: this.props.previewImageUrl,
      isPrivate: !this.props.isPublic,
      linkProps: {
        target: '_blank',
        'aria-label': getAriaLabel(this.props)
      }
    };
  }

  render() {
    return <ViewCard {...this.viewCardProps()} />;
  }
}

Card.propTypes = {
  categories: PropTypes.array,
  createdAt: PropTypes.string,
  description: PropTypes.string,
  id: PropTypes.string,
  isFederated: PropTypes.bool,
  isPublic: PropTypes.bool,
  link: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  previewImageUrl: PropTypes.string,
  provenance: PropTypes.string,
  tags: PropTypes.array,
  type: PropTypes.string.isRequired,
  updatedAt: PropTypes.string,
  viewCount: PropTypes.number.isRequired
};

Card.defaultProps = {
  link: '',
  name: '',
  type: '',
  viewCount: 0
};

export default Card;
