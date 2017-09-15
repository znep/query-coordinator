import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import CustomizationTabPane from './CustomizationTabPane';
import ScrollView from './shared/ScrollView';

export class CustomizationTabPanes extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'focusFirstTabPaneAccordion',
      'paneAttributes',
      'pane'
    ]);
  }

  componentWillUpdate(nextProps) {
    if (this.props.selection !== nextProps.selection) {
      this.focusFirstTabPaneAccordion();
    }
  }

  focusFirstTabPaneAccordion() {
    const MAX_TIMEOUT = 3000;
    const accumulator = 100;

    let accumulatedTime = 0;
    let intervalId = setInterval(() => {
      const accordion = document.querySelector('.customization-tab-pane:not(.customization-tab-pane_hidden) .socrata-accordion-pane-title');
      const emptyPane = document.querySelector('.authoring-empty-pane');

      if (accordion) {
        accordion.focus();
        clearInterval(intervalId);
      } else if (emptyPane) {
        clearInterval(intervalId);
      } else if (accumulatedTime > MAX_TIMEOUT) {
        clearInterval(intervalId);
      } else {
        accumulatedTime += accumulator;
      }
    }, accumulator);
  }

  paneAttributes(tab) {
    return {
      key: tab.id,
      id: tab.id,
      show: tab.id === this.props.selection
    };
  }

  pane(tab) {
    return (
      <CustomizationTabPane {...this.paneAttributes(tab)}>
        {React.createElement(tab.paneComponent)}
      </CustomizationTabPane>
    );
  }

  render() {
    return (
      <ScrollView className="visualization-tab-panes">
        {_.map(this.props.tabs, tab => { return this.pane(tab); })}
      </ScrollView>
    );
  }
}

CustomizationTabPanes.propTypes = {
  tabs: PropTypes.array,
  selection: PropTypes.string
};

export default CustomizationTabPanes;
