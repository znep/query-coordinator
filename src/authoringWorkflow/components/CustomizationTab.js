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

  handleKeyDown (event) {
    if (event.keyCode == 13) {
      this.props.onTabNavigation(event);
      event.preventDefault();
    }
  },

  linkAttributes() {
    const { id, selected, onTabNavigation, title } = this.props;

    return {
      id: `${id}-link`,
      href: `#${id}`,
      tabIndex: -1,
      onClick: onTabNavigation,
      'aria-label': title,
      'aria-controls': `${id}-panel`
    };
  },

  listItemAttributes() {
    return {
      key: this.props.id,
      className: classNames('tab-link', {'current': this.props.selected}),
      onKeyDown: this.handleKeyDown,
      role: 'tab',
      tabIndex: 0,
      href: `#${this.props.id}`,
      'aria-label': this.props.title,
      'aria-selected': this.props.selected,
      'aria-controls': `${this.props.id}-panel`
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
