import cx from 'classnames';
import getOr from 'lodash/fp/getOr';
import isString from 'lodash/fp/isString';
import PropTypes from 'prop-types';
import React, { Children, cloneElement, Component } from 'react';
import cssModules from 'react-css-modules';
import { Motion, spring } from 'react-motion';

import { SocrataIcon } from 'common/components/SocrataIcon';

import styles from './expandable.module.scss';

class Expandable extends Component {
  render() {
    const { itemHeight, isExpanded, styles } = this.props;
    const className = cx(this.props.itemContainerClassName, getOr('', 'expandable', styles));
    const [firstChild, ...children] = Children.toArray(this.props.children);
    const numItems = children.length;
    const FirstItem = firstChild
      ? isString(firstChild.type) ? firstChild : cloneElement(firstChild, { isExpanded })
      : null;
    return (
      <div className={this.props.className}>
        {FirstItem}
        <Motion style={{ height: spring(isExpanded ? numItems * itemHeight : 0) }}>
          {style =>
            <div className={className} style={style}>
              {children}
            </div>}
        </Motion>
      </div>
    );
  }
}

Expandable.propTypes = {
  isExpanded: PropTypes.bool,
  itemHeight: PropTypes.number.isRequired,
  itemContainerClassName: PropTypes.string
};

const ExpanderIcon = ({ isExpanded }) => <SocrataIcon name={isExpanded ? 'arrow-up' : 'arrow-down'} />;

class Trigger extends Component {
  render() {
    const { className, isExpanded, onClick } = this.props;
    return (
      <div styleName="trigger">
        <div className={className + (isExpanded ? ' expanded' : '')} onClick={onClick} >
          <ExpanderIcon isExpanded={isExpanded} />
          {this.props.children}
        </div>
      </div>
    );
  }
}

Trigger.propTypes = {
  isExpanded: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

Expandable.Trigger = cssModules(Trigger, styles);

export default cssModules(Expandable, styles);
