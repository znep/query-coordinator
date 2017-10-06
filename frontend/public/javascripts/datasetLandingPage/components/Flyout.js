import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component, PureComponent } from 'react';
import classNames from 'classnames';
import { ESCAPE } from 'common/dom_helpers/keycodes';
import closeIcon from 'common/resources/fonts/svg/close.svg';

export class Flyout extends Component {
  constructor(props) {
    super(props);

    // Need flyout to be rendered outside of viewport for measuring it
    this.state = {
      top: -10000,
      left: -10000,
      hidden: false
    };

    _.bindAll(this, [
      'positionSelf',
      'onMouseLeave',
      'onMouseEnter',
      'onClick',
      'onClickDocument',
      'onKeyUpDocument',
      'bindPositioningEvents',
      'unBindPositioningEvents',
      'bindDocumentEvents',
      'unBindDocumentEvents',
      'hideFlyout'
    ]);

    this.positionSelf = _.throttle(this.positionSelf, 100);
  }

  componentDidMount() {
    // After component mounts, do a initial positioning and then hide flyout for further use.
    this.positionSelf(null, this.hideFlyout);
  }

  componentWillUnmount() {
    // Garbage collection
    this.unBindPositioningEvents();
    this.unBindDocumentEvents();
  }

  onMouseEnter() {
    // When mouse enters flyout area, check for a debounced close flyout event.
    // Cancel debounced function to prevent closing flyout
    this.state.debouncedMouseLeft && // eslint-disable-line no-unused-expressions
      _.isFunction(this.state.debouncedMouseLeft) &&
      this.state.debouncedMouseLeft.cancel();

    this.setState({ debouncedMouseLeft: false });
    this.revealFlyout();
  }

  onMouseLeave() {
    // This allows user to move cursor from target element to flyout content.
    const debouncedEvent = _.debounce(this.hideFlyout, 150);

    this.setState({ debouncedMouseLeft: debouncedEvent }, debouncedEvent);
  }

  onClick() {
    this.revealFlyout();
  }

  onClickDocument(event) {
    // Hide flyout if clicked outside of our scope
    if (!this.containerRef.contains(event.target)) {
      this.hideFlyout();
    }
  }

  onKeyUpDocument(event) {
    if (event.keyCode === ESCAPE) {
      this.hideFlyout();
    }
  }

  getTrigger() {
    const { trigger } = this.props;
    const { onClick, onMouseEnter, onMouseLeave } = this;

    if (trigger === 'click') {

      return { onClick };
    } else if (trigger === 'hover') {

      return { onMouseEnter, onMouseLeave };
    }
  }

  positionSelf(event, callback = _.noop) {
    let left;
    let top;
    const mobileWidthBreakpoint = 420;
    const windowWidth = window.innerWidth; // With scrollbar

    if (windowWidth <= mobileWidthBreakpoint) {
      left = 0;
      top = 0;
    } else {
      const flyoutDimensions = this.flyoutRef.getBoundingClientRect();
      const targetDimensions = this.targetRef.getBoundingClientRect();

      left = targetDimensions.left - flyoutDimensions.width + (targetDimensions.width / 2);
      top = targetDimensions.top + targetDimensions.height + 15;

      const flyoutWidth = flyoutDimensions.width;
      const bodyWidth = document.body.offsetWidth; // Without scrollbar

      // exceedsBodyWidth
      const exceedsBodyWidth = left + flyoutWidth > bodyWidth;
      if (exceedsBodyWidth && windowWidth > mobileWidthBreakpoint) {
        left -= flyoutWidth - targetDimensions.width;
      }
    }

    this.setState({ left, top }, callback);
  }

  bindPositioningEvents() {
    ['resize', 'scroll', 'wheel'].forEach(e => window.addEventListener(e, this.positionSelf));
  }

  unBindPositioningEvents() {
    ['resize', 'scroll', 'wheel'].forEach(e => window.removeEventListener(e, this.positionSelf));
  }

  // Documents events are for catching outside clicks and ESC key.
  bindDocumentEvents() {
    document.addEventListener('click', this.onClickDocument);
    document.addEventListener('keyup', this.onKeyUpDocument);
  }

  unBindDocumentEvents() {
    document.removeEventListener('click', this.onClickDocument);
    document.removeEventListener('keyup', this.onKeyUpDocument);
  }

  revealFlyout() {
    this.setState(
      { hidden: false },
      () => {
        this.bindPositioningEvents();
        this.bindDocumentEvents();
        this.positionSelf();
      }
    );
  }

  hideFlyout() {
    this.setState(
      { hidden: true },
      () => {
        // Don't need to calculate position while flyout is hidden
        this.unBindPositioningEvents();
        // Don't need to know if user clicked elsewhere while flyout is hidden
        this.unBindDocumentEvents();
      }
    );
  }

  render() {
    const { children, position, className, targetElement } = this.props;
    const { top, left, hidden } = this.state;

    const flyoutClass = classNames('dslp-flyout', {
      'flyout-hidden': hidden,
      'flyout-right': position === 'right',
      'flyout-left': position === 'left'
    });

    const modifiedTargetElement = React.cloneElement(
      targetElement,
      {
        ref: (ref) => this.targetRef = ref,
        ...this.getTrigger()
      }
    );

    // Flyout container props
    const containerProps = {
      className: classNames('flyout-container', className),
      ref: (ref) => this.containerRef = ref
    };

    // Flyout content props
    const contentProps = {
      className: flyoutClass,
      style: { left, top },
      ref: (ref) => this.flyoutRef = ref
    };

    // Passing onDismiss callback to content children
    const modChildren = React.Children.map(
      children,
      el => React.cloneElement(el, { onDismiss: this.hideFlyout })
    );

    return (
      <div {...containerProps}>
        {modifiedTargetElement}
        <div>
          <div {...contentProps}>
            <section className="flyout-content">
              {modChildren}
            </section>
          </div>
        </div>
      </div>
    );
  }
}

Flyout.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element),
  className: PropTypes.string,
  position: PropTypes.string.isRequired,
  targetElement: PropTypes.object,
  trigger: PropTypes.oneOf(['click', 'hover'])
};

Flyout.defaultProps = {
  trigger: 'hover',
  left: false,
  right: false
};

export class FlyoutHeader extends PureComponent {
  render() {
    const { title, description, onDismiss } = this.props;

    const iconProps = {
      className: 'close-icon',
      dangerouslySetInnerHTML: { __html: closeIcon },
      onClick: onDismiss
    };

    return (
      <div className="flyout-header">
        <div className="flyout-title">
          <h1>{title}</h1>
          <span {...iconProps} />
        </div>
        <div className="flyout-description">
          {description}
        </div>
      </div>
    );
  }
}

FlyoutHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  onDismiss: PropTypes.func
};

export class FlyoutContent extends PureComponent {
  render() {
    const { children } = this.props;

    return (
      <div>
        {children}
      </div>
    );
  }
}
