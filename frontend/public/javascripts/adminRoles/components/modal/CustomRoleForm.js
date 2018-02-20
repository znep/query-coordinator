import cx from 'classnames';
import getOr from 'lodash/fp/getOr';
import omit from 'lodash/fp/omit';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { customConnect, I18nPropType } from 'common/connectUtils';

import * as Actions from '../../actions';
import * as Selectors from '../../adminRolesSelectors';
import { NEW_CUSTOM_ROLE } from '../../appStates';
import BoundedTextInput from '../util/BoundedTextInput';
import TemplateDropdown from './TemplateDropdown';
import styles from './custom-role-form.module.scss';

const mapStateToProps = state => {
  const appState = Selectors.getAppState(state);

  const roleToEdit = Selectors.getEditingRoleFromState(state);

  return {
    ...roleToEdit.toJS(),
    editingNewRole: appState === NEW_CUSTOM_ROLE,
    maxCharacterCount: Selectors.getMaxCharacterCountFromState(state)
  };
};

const mapDispatchToProps = {
  onNameChange: Actions.changeNewRoleName,
  onTemplateChange: Actions.changeNewRoleTemplate
};

class CustomRoleForm extends Component {
  static propTypes = {
    I18n: I18nPropType,
    editingNewRole: PropTypes.bool.isRequired,
    error: PropTypes.object,
    hasError: PropTypes.bool,
    maxCharacterCount: PropTypes.number.isRequired,
    name: PropTypes.string,
    onNameChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onTemplateChange: PropTypes.func.isRequired,
    template: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  };

  focusInput = () => {
    this.nameInput.focus();
  };

  componentDidMount() {
    this.focusInput();
  }

  componentDidUpdate() {
    if (this.props.hasError) {
      this.focusInput();
    }
  }

  render() {
    const {
      I18n,
      editingNewRole,
      error,
      hasError,
      maxCharacterCount,
      name,
      onSubmit,
      onNameChange,
      onTemplateChange,
      template
    } = this.props;

    const textInputClasses = cx(
      {
        'text-input-error': hasError
      },
      'text-input'
    );

    return (
      <form
        onSubmit={ev => {
          ev.preventDefault();
          onSubmit();
        }}
      >
        <label className="block-label" htmlFor="role-name">
          {I18n.t('screens.admin.roles.index_page.custom_role_modal.form.role_name.label')}
        </label>
        <BoundedTextInput
          maxCharacterCount={maxCharacterCount}
          inputRef={input => {
            this.nameInput = input;
          }}
          styleName="role-name"
          className={textInputClasses}
          id="role-name"
          type="text"
          placeholder={I18n.t(
            'screens.admin.roles.index_page.custom_role_modal.form.role_name.placeholder'
          )}
          onChange={event => onNameChange(event.target.value)}
          value={name}
        />
        {hasError && (
          <div className="alert error">
            {I18n.t(getOr('', 'message', error), omit(['message'], error))}
          </div>
        )}
        {editingNewRole && (
          <label className="block-label" htmlFor="template-name">
            {I18n.t('screens.admin.roles.index_page.custom_role_modal.form.template.label')}
          </label>
        )}
        {editingNewRole && <TemplateDropdown onChange={value => onTemplateChange(value)} value={template} />}
      </form>
    );
  }
}

export default customConnect({ mapStateToProps, mapDispatchToProps, styles })(CustomRoleForm);
