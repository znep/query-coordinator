import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { SocrataIcon } from '../SocrataIcon';
import Scrolls from './Scrolls';

class AccordionPane extends React.Component {
  constructor(props) {
    super(props);

    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.shouldScroll = false;
  }

  handleKeyDown(event) {
    const firstPaneTitle = document.querySelector('.customization-tab-pane:not(.customization-tab-pane_hidden) .socrata-accordion-pane-title');
    const isFirstPaneTitle = this.paneTitleElement === firstPaneTitle;
    const isShiftTab = event.shiftKey && event.keyCode === 9;

    if (event.keyCode == 13 || event.keyCode == 32) {
      this.props.onToggle(this.props.paneId);
      event.preventDefault();
    } else if (isShiftTab && isFirstPaneTitle) {
      this.focusCurrentCustomizationTab();
      event.preventDefault();
    }
  }

  focusCurrentCustomizationTab() {
    document.querySelector('.tab-link.current a').focus();
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.isOpen && nextProps.isOpen) {
      this.shouldScroll = true;
    }
  }

  componentDidUpdate() {
    if (this.shouldScroll) {
      this.props.scroll.toView(this.refs.content);
      this.shouldScroll = false;
    }
  }

  render() {
    const { title, children, isOpen, className } = this.props;

    const paneClasses = classNames(className, 'socrata-accordion-pane', {
      'open': isOpen
    });

    return (
      <div className={paneClasses}>
        <div className="socrata-accordion-pane-title"
          role="button"
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-label={this.props['aria-label'] || title}
          onClick={() => this.props.onToggle(this.props.paneId)}
          tabIndex="0"
          onKeyDown={this.handleKeyDown}
          ref={(ref) => this.paneTitleElement = ref}>
          <span>{title}</span>
          <SocrataIcon name="arrow-down" className="dropdown-caret" key="dropdown-caret" />
        </div>
        <div className="socrata-accordion-pane-content" ref="content">
          {children}
        </div>
      </div>
    );
  }
}

AccordionPane.defaultProps = {
  onToggle: _.noop,
  isOpen: false
};

AccordionPane.propTypes = {
  title: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  paneId: PropTypes.string
};

export default Scrolls(AccordionPane);
