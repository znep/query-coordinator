import React from 'react';
import classNames from 'classnames';

export var CustomizationTab = React.createClass({
  propTypes: {
    onTabNavigation: React.PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      selected: false
    };
  },

  linkAttributes() {
    const { id, selected, onTabNavigation, title } = this.props;

    return {
      id: `${id}-link`,
      href: `#${id}`,
      onClick: onTabNavigation,
      role: 'tab',
      'aria-label': title,
      'aria-controls': `${id}-panel`,
      'aria-selected': selected
    };
  },

  listItemAttributes() {
    return {
      key: this.props.id,
      className: classNames('tab-link', {'current': this.props.selected})
    };
  },

  render() {
    const {id, title, icon} = this.props;

    return (
      <li {...this.listItemAttributes()}>
        <a {...this.linkAttributes()} onClick={(event) => event.preventDefault()}>
          <span className={`icon-${icon}`} role="presentation" />
        </a>
        <span id={id} className="pane-tooltip">{title}</span>
      </li>
    );
  }
});

export default CustomizationTab;
