import _ from 'lodash';
import React from 'react';
import classNames from 'classnames';
import Scrolls from '../shared/Scrolls';

class AccordionPane extends React.Component {
  constructor(props) {
    super(props);

    this.handleOnClickTitle = this.handleOnClickTitle.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.shouldScroll = false;
  }

  handleOnClickTitle() {
    this.props.onToggle(this.props.paneId);
  }

  handleKeyDown(event) {
    if (event.keyCode == 13 || event.keyCode == 32) {
      this.props.onToggle(this.props.paneId);
      event.preventDefault();
    }
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
             onClick={this.handleOnClickTitle}
             tabIndex="0"
             onKeyDown={this.handleKeyDown}>
          <span>{title}</span>
          <div className="dropdown-caret"></div>
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
  title: React.PropTypes.string.isRequired,
  onToggle: React.PropTypes.func.isRequired,
  isOpen: React.PropTypes.bool,
  paneId: React.PropTypes.string
};

export default Scrolls(AccordionPane);
