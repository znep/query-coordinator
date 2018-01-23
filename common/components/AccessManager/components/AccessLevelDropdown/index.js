import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';
import Dropdown from 'common/components/Dropdown';

import UserAccessLevelPropType from 'common/components/AccessManager/propTypes/UserAccessLevelPropType';

import styles from './dropdown.module.scss';

/**
 * Dropdown for choosing the "Access Level" for a user
 * (that is, basically, their view-level role)
 */
class AccessLevelDropdown extends Component {

  static propTypes = {
    // called when a selection is made
    onSelection: PropTypes.func.isRequired,

    // currently selected value
    value: UserAccessLevelPropType,

    // list of options
    options: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: UserAccessLevelPropType.isRequired
    }))
  };

  static defaultProps = {
    onSelection: () => {}
  };

  /**
   * Given a list of access levels, translates them to options for the dropdowns
   * (that is, their translated name as the title)
   */
  static accessLevelsToOptions = (levels) =>
    levels.map(level => ({
      title: I18n.t(
        `shared.site_chrome.access_manager.access_levels.${level.name}`
      ),
      value: level
    })
  );

  render() {
    const {
      options,
      onSelection,
      value
    } = this.props;

    return (
      <div styleName="dropdown">
        <Dropdown
          displayTrueWidthOptions
          onSelection={onSelection}
          options={options}
          value={value} />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  options:
    state.permissions.permissions ?
      // these actually come from the api!
      AccessLevelDropdown.accessLevelsToOptions(state.permissions.permissions.accessLevels) :
      null
});

export default connect(mapStateToProps)(cssModules(AccessLevelDropdown, styles));
