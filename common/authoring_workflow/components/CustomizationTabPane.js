import React from 'react';
import classNames from 'classnames';

export default class CustomizationTabPane extends React.Component {
  render() {
    const isHidden = !this.props.show;
    const attributes = {
      key: this.props.id,
      id: `${this.props.id}-panel`,
      className: classNames('customization-tab-pane', { 'customization-tab-pane_hidden': isHidden }),
      role: 'tabpanel',
      'aria-hidden': isHidden,
      'aria-labelledby': `${this.props.id}-link`
    };

    return <div {...attributes}>{this.props.children}</div>;
  }
}

CustomizationTabPane.defaultProps = {
  show: false
};
