import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';

// Generic wrapper structure for the panels of the measure's edit modal.
// Sets properties for visibility and accessibility.
export class EditModalPanel extends Component {
  render() {
    const { children, id, isSelected } = this.props;

    const panelAttributes = {
      className: classNames('measure-edit-modal-panel', {
        'hidden': !isSelected
      }),
      id: `${id}-panel`,
      key: id,
      role: 'tabpanel',
      'aria-hidden': !isSelected,
      'aria-labelledby': `${id}-link`
    };

    return (
      <div {...panelAttributes}>
        {children}
      </div>
    );
  }
}

EditModalPanel.propTypes = {
  children: PropTypes.node,
  id: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired
};

export default EditModalPanel;
