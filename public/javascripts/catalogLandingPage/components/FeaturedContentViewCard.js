import React, { PropTypes } from 'react';
import { ExternalViewCard, ViewCard } from 'socrata-components';

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
  displayType: PropTypes.string,
  icon: PropTypes.string,
  imageUrl: PropTypes.string,
  isPrivate: PropTypes.bool,
  name: PropTypes.string.isRequired,
  position: PropTypes.number,
  previewImage: PropTypes.string,
  resource_id: PropTypes.number,
  rowsUpdatedAt: PropTypes.number,
  uid: PropTypes.string,
  url: PropTypes.string,
  viewCount: PropTypes.number
};

FeaturedContentViewCard.defaultProps = {
  contentType: '',
  description: '',
  displayType: '',
  icon: '',
  isPrivate: false,
  position: 0,
  name: '',
  url: '',
  viewCount: 0
};

export default FeaturedContentViewCard;
