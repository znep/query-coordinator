import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';

export default class Accordion extends React.Component {
  constructor(props) {
    super(props);

    // Collect open by default panes
    var openPanes = React.Children.map(props.children, (pane, index) => {
      return pane && (index === 0 || pane.props.isOpen) ? `pane-${index}` : null;
    });

    // openPanes is an array of keys (or indexes) of children panes
    // Child Pane's will be associated with ids on first run
    this.state = {
      openPanes: openPanes,
      firstRun: true
    };

    this.handlePaneToggle = this.handlePaneToggle.bind(this);
  }

  handlePaneToggle(paneId) {
    const openPanes = this.state.openPanes;
    const isPaneOpen = openPanes.indexOf(paneId) >= 0;

    const updatedOpenPanes = isPaneOpen ? _.without(openPanes, paneId) : _.concat(openPanes, paneId);

    this.setState({ openPanes: updatedOpenPanes });
  }

  renderPanes() {
    const { children } = this.props;
    const { openPanes, firstRun } = this.state;

    return React.Children.map(children, (pane, index) => {
      const onToggle = this.handlePaneToggle;
      const paneId = firstRun ? `pane-${index}` : pane.props.paneId;
      const isOpen = openPanes.indexOf(paneId) >= 0;

      if (!pane) {
        return pane;
      }

      return React.cloneElement(pane, {
        isOpen,
        onToggle,
        paneId
      });
    });
  }

  render() {
    return (
      <div className="socrata-accordion-container">
        { this.renderPanes() }
      </div>
    );
  }
}

Accordion.defaultProps = {
  defaultPane: 'pane-0'
};

Accordion.propTypes = {
  defaultPane: PropTypes.string
};
