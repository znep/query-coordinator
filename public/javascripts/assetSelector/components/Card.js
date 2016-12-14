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
    const data = this.props.data;

    return {
      name: data.name,
      description: data.description,
      url: data.link,
      icon: getIconClassForDisplayType(data.type),
      metadataLeft: getDateLabel(data.updated_at),
      metadataRight: getViewCountLabel(data.view_count),
      imageUrl: data.preview_image_url,
      isPrivate: !data.is_public,
      linkProps: {
        target: '_blank',
        'aria-label': getAriaLabel(data)
      }
    };
  }

  render() {
    return <ViewCard {...this.viewCardProps()} />;
  }
}

Card.propTypes = {
  data: PropTypes.object.isRequired
};

Card.defaultProps = {
  data: {}
};

export default Card;
