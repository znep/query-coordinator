import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cx from 'classnames';
import cssModules from 'react-css-modules';
import styles from './custom-role-form.module.scss';
import bindAll from 'lodash/fp/bindAll';
import getOr from 'lodash/fp/getOr';
import omit from 'lodash/fp/omit';
import { connect } from 'react-redux';
import * as Actions from '../../actions';
import { NEW_CUSTOM_ROLE } from '../../appStates';
import BoundedTextInput from '../util/BoundedTextInput';
import { getAppState, getEditingRoleFromState, getMaxCharacterCountFromState } from '../../adminRolesSelectors';
import TemplateDropdown from './TemplateDropdown';
import { connectLocalization } from 'common/components/Localization';

const mapStateToProps = state => {
  const appState = getAppState(state);

  const roleToEdit = getEditingRoleFromState(state);

  return {
    ...roleToEdit.toJS(),
    editingNewRole: appState === NEW_CUSTOM_ROLE,
    maxCharacterCount: getMaxCharacterCountFromState(state)
  };
};

const mapDispatchToProps = {
  onNameChange: Actions.changeNewRoleName,
  onTemplateChange: Actions.changeNewRoleTemplate
};

class CustomRoleForm extends Component {
  constructor(props) {
    super(props);
    bindAll(['focusInput']);
  }

  focusInput() {
    this.nameInput.focus();
  }

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
      editingNewRole,
      error,
      hasError,
      maxCharacterCount,
      name,
      onSubmit,
      onNameChange,
      onTemplateChange,
      template,
      localization: { translate }
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
          {translate('screens.admin.roles.index_page.custom_role_modal.form.role_name.label')}
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
          placeholder={translate(
            'screens.admin.roles.index_page.custom_role_modal.form.role_name.placeholder'
          )}
          onChange={event => onNameChange(event.target.value)}
          value={name}
        />
        {hasError &&
          <div className="alert error">
            {translate(getOr('', 'message', error), omit(['message'], error))}
          </div>}
        {editingNewRole &&
          <label className="block-label" htmlFor="template-name">
            {translate('screens.admin.roles.index_page.custom_role_modal.form.template.label')}
          </label>}
        {editingNewRole && <TemplateDropdown onChange={value => onTemplateChange(value)} value={template} />}
      </form>
    );
  }
}

CustomRoleForm.propTypes = {
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

export default connectLocalization(
  connect(mapStateToProps, mapDispatchToProps)(cssModules(CustomRoleForm, styles))
);
