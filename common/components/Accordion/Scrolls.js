import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

export default function Scrolls(component) {
  let ScrollsWrapper = function(props, context) {
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
    scroll: PropTypes.shape({
      horizontal: PropTypes.func,
      vertical: PropTypes.func,
      toView: PropTypes.func
    })
  };

  return ScrollsWrapper;
}
