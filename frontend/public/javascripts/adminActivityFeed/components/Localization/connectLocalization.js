import _ from 'lodash';
import React from 'react';

export default function(component) {
  function LocalizedComponent(props, context) {
    const { localization } = context;
    return React.createElement(component, _.assign({ localization }, props || {}));
  }

  LocalizedComponent.contextTypes = {
    localization: React.PropTypes.object
  };

  return LocalizedComponent;
}
