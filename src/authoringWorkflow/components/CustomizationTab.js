import React from 'react';
import classNames from 'classnames';

export var CustomizationTab = React.createClass({
  getDefaultProps() {
    return {
      selected: false
    };
  },

  linkAttributes() {
    return {
      id: `${this.props.id}-link`,
      href: `#${this.props.id}`,
      onFocus: this.props.onTabNavigation,
      'aria-selected': this.props.selected,
      'aria-controls': `${this.props.id}-panel`
    };
  },

  listItemAttributes() {
    return {
      key: this.props.id,
      className: classNames('tab-link', {'current': this.props.selected}),
      role: 'presentation'
    };
  },

  render() {
    const {title, icon} = this.props;

    return (
      <li {...this.listItemAttributes()}>
        <a {...this.linkAttributes()} title={title}>
          <i className={`icon-${icon}`} />
        </a>
        <span className="pane-tooltip">{title}</span>
      </li>
    );
  }
});

export default CustomizationTab;
