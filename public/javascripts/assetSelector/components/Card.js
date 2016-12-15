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
      metadataLeft: getDateLabel(this.props.updated_at),
      metadataRight: getViewCountLabel(this.props.view_count),
      imageUrl: this.props.preview_image_url,
      isPrivate: !this.props.is_public,
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
  created_at: PropTypes.string,
  description: PropTypes.string,
  display_title: PropTypes.string,
  id: PropTypes.string,
  is_federated: PropTypes.bool,
  is_public: PropTypes.bool,
  link: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  preview_image_url: PropTypes.string,
  provenance: PropTypes.string,
  tags: PropTypes.array,
  type: PropTypes.string.isRequired,
  updated_at: PropTypes.string,
  view_count: PropTypes.number.isRequired
};

Card.defaultProps = {
  link: '',
  name: '',
  type: '',
  view_count: 0
};

export default Card;
