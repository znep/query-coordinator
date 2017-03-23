import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { findDOMNode } from 'react-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { updateNameAndDescription, closeEditMenu } from '../actions';
import { t } from '../lib/I18n';
import { ExpandableMenuListItem, SideMenu } from 'socrata-components';

export class EditMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: props.name,
      description: props.description,
      isMetadataMenuOpen: props.isActive
    };

    _.bindAll(this, [
      'onNameChange',
      'onDescriptionChange',
      'onClickUpdate',
      'toggleMetadataMenu',
      'renderTitleField',
      'renderDescriptionField',
      'renderMenuItems',
      'renderUpdateButton'
    ]);
  }

  // Select the title field when the menu is opened
  componentDidUpdate(oldProps) {
    const { isActive } = this.props;

    if (!oldProps.isActive && isActive) {
      findDOMNode(this).querySelector('#edit-title-field').select();

      this.setState({
        isMetadataMenuOpen: true
      });
    }
  }

  onNameChange({ target }) {
    this.setState({ name: target.value });
  }

  onDescriptionChange({ target }) {
    this.setState({ description: target.value });
  }

  onClickUpdate(event) {
    const { onClickUpdate } = this.props;
    const { name, description } = this.state;

    event.preventDefault();
    onClickUpdate({ name, description });
  }

  toggleMetadataMenu() {
    const { isMetadataMenuOpen } = this.state;

    this.setState({
      isMetadataMenuOpen: !isMetadataMenuOpen
    });
  }

  renderTitleField() {
    const { name } = this.state;

    const props = {
      id: 'edit-title-field',
      className: 'text-input',
      type: 'text',
      value: name,
      onChange: this.onNameChange
    };

    return (
      <div>
        <label htmlFor="edit-title-field" className="block-label">
          {t('edit_menu.title')}
        </label>
        <input {...props} />
      </div>
    );
  }

  renderDescriptionField() {
    const { description } = this.state;

    const props = {
      id: 'edit-description-field',
      className: 'text-input text-area',
      value: description,
      onChange: this.onDescriptionChange
    };

    return (
      <div>
        <label htmlFor="edit-description-field" className="block-label">
          {t('edit_menu.description')}
        </label>
        <textarea {...props} />
      </div>
    );
  }

  renderMenuItems() {
    const { isMetadataMenuOpen } = this.state;

    const menuItemprops = {
      iconName: 'edit',
      text: t('edit_menu.editTitleAndDescription'),
      isOpen: isMetadataMenuOpen,
      onClick: this.toggleMetadataMenu
    };

    return (
      <ExpandableMenuListItem {...menuItemprops}>
        <div>
          <form>
            {this.renderTitleField()}
            {this.renderDescriptionField()}
            {this.renderUpdateButton()}
          </form>
        </div>
      </ExpandableMenuListItem>
    );
  }

  renderUpdateButton() {
    const { name } = this.state;
    const props = {
      onClick: this.onClickUpdate,
      className: 'btn btn-dark btn-default update-button',
      disabled: _.isEmpty(name)
    };

    return (
      <button {...props}>
        {t('edit_menu.update')}
      </button>
    );
  }

  render() {
    const { isActive, onClickDismiss } = this.props;
    const props = {
      title: t('edit_menu_label'),
      isAnchoredLeft: true,
      isOpen: isActive,
      children: this.renderMenuItems(),
      onDismiss: onClickDismiss
    };

    return (
      <div className="edit-menu">
        <SideMenu {...props} />
      </div>
    );
  }
}

EditMenu.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClickUpdate: PropTypes.func.isRequired,
  onClickDismiss: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  return {
    name: state.view.name || '',
    description: state.view.description || '',
    isActive: state.isEditMenuActive
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onClickUpdate: updateNameAndDescription,
    onClickDismiss: closeEditMenu
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditMenu);
