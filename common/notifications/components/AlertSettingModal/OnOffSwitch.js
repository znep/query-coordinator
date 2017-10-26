import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './on-off-switch.scss';
import classNames from 'classnames';
import _ from 'lodash';

class OnOffSwitch extends Component {
  render() {
    const { onSwitchChange, enableSwitch } = this.props;
    const switchId = _.uniqueId('switch_on_');
    return (<div styleName="on-off-switch">
      <input
        type="checkbox"
        id={switchId}
        name="switch"
        onChange={onSwitchChange}
        checked={!enableSwitch} />
      <label htmlFor={switchId} styleName={classNames({ 'selected': !enableSwitch })}>OFF</label>
      <label htmlFor={switchId} styleName={classNames({ 'selected': enableSwitch })}>ON</label>
    </div>);
  }
}
OnOffSwitch.propTypes = {
  enableSwitch: PropTypes.bool,
  onSwitchChange: PropTypes.func
};
export default cssModules(OnOffSwitch, styles);

