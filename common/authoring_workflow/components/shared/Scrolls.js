import _ from 'lodash';
import React from 'react';

export default function Scrolls(component) {
  let ScrollsWrapper = function (props, context) {
    const mergedProps = _.assign({
      scroll: context.scroll || {
        horizontal: _.noop,
        vertical: _.noop,
        toView: _.noop
      }
    }, props);

    return React.createElement(component, mergedProps);
  };

  ScrollsWrapper.contextTypes = {
    scroll: React.PropTypes.shape({
      horizontal: React.PropTypes.func,
      vertical: React.PropTypes.func,
      toView: React.PropTypes.func
    })
  };

  return ScrollsWrapper;
}
