import React from 'react';
import classNames from 'classnames';

export var CustomizationTab = React.createClass({
  getDefaultProps: function() {
    return {
      selected: false
    };
  },

  linkAttributes: function() {
    return {
      id: `${this.props.id}-link`,
      href: `#${this.props.id}`,
      onFocus: this.props.onTabNavigation,
      'aria-selected': this.props.selected,
      'aria-controls': `${this.props.id}-panel`
    };
  },

  listItemAttributes: function() {
    return {
      key: this.props.id,
      className: classNames('tab-link', {'current': this.props.selected}),
      role: 'presentation'
    };
  },

  render: function() {
    return (
      <li {...this.listItemAttributes()}>
        <a {...this.linkAttributes()}>{this.props.title}</a>
      </li>
    );
  }
});

export default CustomizationTab;
