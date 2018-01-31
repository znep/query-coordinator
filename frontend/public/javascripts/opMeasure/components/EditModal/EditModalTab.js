import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

// Generic wrapper structure for the tabs of the measure's edit modal.
// Sets properties for visibility and accessibility; also wires up the tab
// navigation handling from the parent component.
export class EditModalTab extends Component {
  render() {
    const { icon, id, isSelected, title, needsAttention, onTabNavigation } = this.props;

    const listItemAttributes = {
      className: classNames('tab-link', { 'current': isSelected })
    };

    const linkAttributes = {
      href: '#',
      id: `${id}-link`,
      role: 'tab',
      'aria-label': title,
      'aria-controls': `${id}-panel`,
      'aria-selected': isSelected,
      onClick: (event) => {
        event.preventDefault();
        onTabNavigation();
      }
    };

    const dotAttributes = {
      className: classNames('tab-dot', { 'tab-attention': needsAttention })
    };

    const iconAttributes = {
      className: `icon-${icon}`,
      role: 'presentation'
    };

    const titleAttributes = {
      className: 'tab-title'
    };

    return (
      <li {...listItemAttributes}>
        <a {...linkAttributes}>
          <span {...dotAttributes} />
          <span {...iconAttributes} />
          <span {...titleAttributes}>{title}</span>
        </a>
      </li>
    );
  }
}

EditModalTab.propTypes = {
  icon: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  needsAttention: PropTypes.bool,
  title: PropTypes.string.isRequired,
  onTabNavigation: PropTypes.func.isRequired
};

export default EditModalTab;
