import React from 'react';
import classNames from 'classnames';

export var CustomizationTab = React.createClass({
  getDefaultProps() {
    return {
      selected: false
    };
  },

  linkAttributes() {
    const { id, selected, onTabNavigation } = this.props;

    return {
      id: `${id}-link`,
      href: `#${id}`,
      onFocus: onTabNavigation,
      'aria-selected': selected,
      'aria-controls': `${id}-panel`,
      'aria-labelledby': id
    };
  },

  listItemAttributes() {
    return {
      key: this.props.id,
      className: classNames('tab-link', {'current': this.props.selected}),
      role: 'presentation'
    };
  },

  onClick(event) {
    event.preventDefault();
  },

  render() {
    const {id, title, icon} = this.props;

    return (
      <li {...this.listItemAttributes()}>
        <a {...this.linkAttributes()} onClick={this.onClick}>
          <span className={`icon-${icon}`} role="presentation" />
        </a>
        <span id={id} className="pane-tooltip">{title}</span>
      </li>
    );
  }
});

export default CustomizationTab;
