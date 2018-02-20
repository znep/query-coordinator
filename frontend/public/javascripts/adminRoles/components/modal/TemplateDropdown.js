import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Dropdown from 'common/components/Dropdown';
import { customConnect, I18nPropType } from 'common/connectUtils';

import * as Selectors from '../../adminRolesSelectors';
import styles from './template-dropdown.module.scss';

const roleTypeAsTranslationString = role => (Selectors.roleIsCustom(role) ? 'custom' : 'default');

const mapStateToProps = (state, { I18n }) => ({
  templates: Selectors.getRolesFromState(state)
    .map(role => ({
      title: Selectors.roleIsCustom(role)
        ? Selectors.getRoleNameFromRole(role)
        : I18n.t(Selectors.getRoleNameTranslationKeyPathFromRole(role)),
      value: Selectors.getIdFromRole(role),
      group: I18n.t(
        `screens.admin.roles.index_page.custom_role_modal.form.template.${roleTypeAsTranslationString(role)}`
      )
    }))
    .toJS()
});

class TemplateDropdown extends Component {
  static propTypes = {
    I18n: I18nPropType,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  };

  render() {
    const { I18n, onChange, templates, value } = this.props;
    const dropdownProps = {
      value,
      onSelection: option => onChange(option.value),
      options: [
        {
          title: I18n.t('screens.admin.roles.index_page.custom_role_modal.form.template.none_selected'),
          value: null
        }
      ].concat(templates),
      placeholder: I18n.t('screens.admin.roles.index_page.custom_role_modal.form.template.none_selected')
    };

    return (
      <div styleName="template-dropdown">
        <Dropdown {...dropdownProps} />
      </div>
    );
  }
}

export default customConnect({ mapStateToProps, styles })(TemplateDropdown);
