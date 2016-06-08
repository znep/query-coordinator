import React, { PropTypes } from 'react';
import ViewWidget from './ViewWidget';

var FeaturedItemWidget = function(props) {
  var { children, contentType, title, description, url, featuredView } = props;

  var widgetProps;
  if (contentType === 'external') {
    widgetProps = {
      name: title,
      description: description,
      url: url,
      isExternal: true
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
  title: PropTypes.string,
  url: PropTypes.string
};

export default FeaturedItemWidget;
