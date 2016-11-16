import React from 'react';
import classNames from 'classnames';
import _ from 'lodash';

export default class AccordionPane extends React.Component {
  constructor(props) {
    super(props);

    this.handleOnClickTitle = this.handleOnClickTitle.bind(this);
  }

  handleOnClickTitle() {
    this.props.onToggle(this.props.paneId);
  }

  render() {
    const { title, children, isOpen, className } = this.props;

    const paneClasses = classNames(className, 'socrata-accordion-pane', {
      'open': isOpen
    });

    return (
      <div className={paneClasses}>
        <div className="socrata-accordion-pane-title" onClick={this.handleOnClickTitle}>
          <span>{title}</span>
          <div className="dropdown-caret"></div>
        </div>
        <div className="socrata-accordion-pane-content">
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
  onToggle: React.PropTypes.func,
  isOpen: React.PropTypes.bool,
  paneId: React.PropTypes.string
};
