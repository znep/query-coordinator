import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { updateNameAndDescription, closeEditMenu } from '../actions';
import I18n from 'common/i18n';
import { ExpandableMenuListItem, SideMenu } from 'common/components';

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

  componentWillReceiveProps(nextProps) {
    const { isActive } = this.props;

    if (!isActive && nextProps.isActive) {
      this.setState({
        isMetadataMenuOpen: true
      });
    }
  }

  // TODO: Remove this when EN-15238 is addressed. We have to manually select the title because
  // the SideMenu has two things trying to manage focus and hitting it hard with a hammer here is
  // what we decided to do as a bandaid.
  componentDidUpdate(prevProps) {
    if (!prevProps.isActive && this.props.isActive && this.title) {
      this.title.select();
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
      onChange: this.onNameChange,
      ref: (el) => this.title = el
    };

    return (
      <div>
        <label htmlFor="edit-title-field" className="block-label">
          {I18n.t('visualization_canvas.edit_menu.title')}
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
          {I18n.t('visualization_canvas.edit_menu.description')}
        </label>
        <textarea {...props} />
      </div>
    );
  }

  renderMenuItems() {
    const { isMetadataMenuOpen } = this.state;

    const menuItemprops = {
      iconName: 'edit',
      text: I18n.t('visualization_canvas.edit_menu.editTitleAndDescription'),
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
        {I18n.t('visualization_canvas.edit_menu.update')}
      </button>
    );
  }

  render() {
    const { isActive, onClickDismiss } = this.props;
    const props = {
      title: I18n.t('visualization_canvas.edit_menu_label'),
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
