import React, { PropTypes } from 'react';
import ViewWidget from './ViewWidget';

var FeaturedItemWidget = function(props) {
  var { children, contentType, title, description, url, previewImage, featuredView } = props;

  var widgetProps;
  if (contentType === 'external') {

    // If the image url doesn't start with http and isn't a data url, assume it's a blob ID.
    if (!_.isEmpty(previewImage) && !/^(https?:\/\/|data:)/.test(previewImage)) {
      previewImage = `/api/views/${window.initialState.view.id}/files/${previewImage}`;
    }

    widgetProps = {
      name: title,
      description: description,
      url: url,
      isExternal: true,
      imageUrl: previewImage
    };
  } else if (contentType === 'internal') {
    widgetProps = {
      ...featuredView,
      isExternal: false
    };
  }

  return <ViewWidget {...widgetProps}>{children}</ViewWidget>;
};

FeaturedItemWidget.propTypes = {
  children: PropTypes.node,
  contentType: PropTypes.oneOf(['internal', 'external']),
  description: PropTypes.string,
  featuredView: PropTypes.object,
  previewImage: PropTypes.string,
  title: PropTypes.string,
  url: PropTypes.string
};

export default FeaturedItemWidget;
