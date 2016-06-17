import React from 'react';
import classNames from 'classnames';

export var CustomizationTabPane = React.createClass({
  getDefaultProps() {
    return {
      show: false
    };
  },

  render() {
    var isHidden = !this.props.show;
    var attributes = {
      key: this.props.id,
      id: `${this.props.id}-panel`,
      className: classNames({'customization-tab-pane_hidden': isHidden}),
      role: 'tabpanel',
      'aria-hidden': isHidden,
      'aria-labelledby': `${this.props.id}-link`
    };

    return <div {...attributes}>{this.props.children}</div>;
  }
});

export default CustomizationTabPane;
