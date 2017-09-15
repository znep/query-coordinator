import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  getIdFromRole,
  getRoleNameFromRole,
  getRoleNameTranslationKeyPathFromRole,
  getRolesFromState,
  roleIsCustom
} from '../../selectors';
import cssModules from 'react-css-modules';
import styles from './template-dropdown.scss';
import Dropdown from 'common/components/Dropdown';
import { connectLocalization } from 'common/components/Localization';

const mapStateToProps = (state, { localization: { translate } }) => ({
  templates: getRolesFromState(state)
    .map(role => ({
      title: roleIsCustom(role)
        ? getRoleNameFromRole(role)
        : translate(getRoleNameTranslationKeyPathFromRole(role)),
      value: getIdFromRole(role),
      group: translate(
        `screens.admin.roles.index_page.custom_role_modal.form.template.${roleIsCustom(role)
          ? 'custom'
          : 'default'}`
      )
    }))
    .toJS()
});

class TemplateDropdown extends Component {
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

TemplateDropdown.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string
};

export default connectLocalization(connect(mapStateToProps)(cssModules(TemplateDropdown, styles)));
