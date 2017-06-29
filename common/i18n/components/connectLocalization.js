import _ from 'lodash';
import React from 'react';

export default function(component) {
  function LocalizedComponent(props, context) {
    const { I18n, localization } = context;
    return React.createElement(component, _.assign({ I18n, localization }, props || {}));
  }

  LocalizedComponent.contextTypes = {
    localization: React.PropTypes.object,
    I18n: React.PropTypes.object
  };

  return LocalizedComponent;
}
