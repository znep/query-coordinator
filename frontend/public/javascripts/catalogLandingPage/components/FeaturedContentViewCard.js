import PropTypes from 'prop-types';
import React from 'react';
import { ExternalViewCard, ViewCard } from 'common/components';

export class FeaturedContentViewCard extends React.Component {
  render() {
    const { resource_id: key, children } = this.props;

    if (this.props.contentType === 'external') {
      return <ExternalViewCard key={key} children={children} {...this.props} />;
    } else {
      return <ViewCard key={key} children={children} {...this.props} />;
    }
  }
}

FeaturedContentViewCard.propTypes = {
  children: PropTypes.object,
  contentType: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.string,
  imageUrl: PropTypes.string,
  isPrivate: PropTypes.bool,
  linkProps: PropTypes.object,
  metadataLeft: PropTypes.string,
  metadataRight: PropTypes.string,
  name: PropTypes.string.isRequired,
  resource_id: PropTypes.number,
  url: PropTypes.string
};

FeaturedContentViewCard.defaultProps = {
  description: '',
  isPrivate: false,
  position: 0,
  name: '',
  url: '',
  viewCount: 0
};

export default FeaturedContentViewCard;
