import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';

import Dropdown from 'common/components/Dropdown';
import { connectLocalization } from 'common/components/Localization';

import * as Selectors from '../../adminRolesSelectors';
import styles from './template-dropdown.module.scss';

const roleTypeAsTranslationString = role => (Selectors.roleIsCustom(role) ? 'custom' : 'default');

const mapStateToProps = (state, { localization: { translate } }) => ({
  templates: Selectors.getRolesFromState(state)
    .map(role => ({
      title: Selectors.roleIsCustom(role)
        ? Selectors.getRoleNameFromRole(role)
        : translate(Selectors.getRoleNameTranslationKeyPathFromRole(role)),
      value: Selectors.getIdFromRole(role),
      group: translate(
        `screens.admin.roles.index_page.custom_role_modal.form.template.${roleTypeAsTranslationString(role)}`
      )
    }))
    .toJS()
});

class TemplateDropdown extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  };

  render() {
    const { onChange, templates, value, localization: { translate } } = this.props;
    const dropdownProps = {
      value,
      onSelection: option => onChange(option.value),
      options: [
        {
          title: translate('screens.admin.roles.index_page.custom_role_modal.form.template.none_selected'),
          value: null
        }
      ].concat(templates),
      placeholder: translate('screens.admin.roles.index_page.custom_role_modal.form.template.none_selected')
    };

    return (
      <div styleName="template-dropdown">
        <Dropdown {...dropdownProps} />
      </div>
    );
  }
}

export default connectLocalization(connect(mapStateToProps)(cssModules(TemplateDropdown, styles)));
