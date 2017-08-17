import _ from 'lodash';
import React, { Component, PropTypes } from 'react';

export default function(WrappedComponent) {
  class LocalizedComponent extends Component {
    render() {
      const { localization } = this.context;
      const props = _.assign({ localization }, this.props || {});
      return <WrappedComponent {...props} />;
    }
  }

  LocalizedComponent.contextTypes = {
    localization: PropTypes.object
  };

  return LocalizedComponent;
}
