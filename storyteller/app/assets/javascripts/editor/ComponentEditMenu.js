import _ from 'lodash';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Picklist } from 'common/components';

import I18n from './I18n';
import Actions from './Actions';
import StorytellerUtils from '../StorytellerUtils';
import { dispatcher } from './Dispatcher';
import { moveComponentStore } from './stores/MoveComponentStore';

/**
 * Renders a block component menu that dispatches several component-level
 * actions, such as editing the component, and moving/swapping components.
 *
 * This can be located in the UI by dropping a media block in the story, configuring
 * it, and then mousing over the result. Buttons anchored on the top-right of the
 * component container will appear.
 */
class ComponentEditMenu extends Component {
  constructor(props) {
    super(props);

    this.state = { showPicklist: false };

    this.options = [
      {
        title: I18n.t('editor.components.edit_controls.swap'),
        group: I18n.t('editor.components.edit_controls.groups.actions'),
        icon: 'move',
        value: 'swap',
        render: this.renderPicklistOption
      },
      {
        title: I18n.t('editor.components.edit_controls.reset'),
        group: I18n.t('editor.components.edit_controls.groups.actions'),
        icon: 'cross2',
        value: 'reset',
        render: this.renderPicklistOption
      }
    ];

    _.bindAll(this, ['clickKebabButton', 'clickEditButton', 'selectPicklistItem', 'blurPicklist']);
  }

  clickKebabButton() {
    this.setState({ showPicklist: !this.state.showPicklist });
  }

  clickEditButton(event) {
    const { blockId, componentIndex } = StorytellerUtils.findBlockIdAndComponentIndex(event.target);

    dispatcher.dispatch({
      action: Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED,
      blockId,
      componentIndex
    });
  }

  selectPicklistItem(option) {
    const { blockId, componentIndex } = StorytellerUtils.findBlockIdAndComponentIndex(this.componentEditControls);

    switch (option.value) {
      case 'reset':
        dispatcher.dispatch({
          action: Actions.RESET_COMPONENT,
          blockId,
          componentIndex
        });
        break;
      case 'swap':
        dispatcher.dispatch({
          action: Actions.MOVE_COMPONENT_START,
          blockId,
          componentIndex
        });
        break;
    }
  }

  focusPicklist(picklist) {
    if (picklist) {
      ReactDOM.findDOMNode(picklist).focus();
    }
  }

  blurPicklist() {
    _.delay(() => {
      if (document.activeElement !== this.kebabButton) {
        this.setState({ showPicklist: false });
      }
    }, 1);
  }

  renderPicklistOption(option) {
    return (
      <div>
        <span className={`socrata-icon-${option.icon}`} />
        <span>{option.title}</span>
      </div>
    );
  }

  renderPicklist() {
    const attributes = {
      options: this.options,
      onBlur: this.blurPicklist,
      onSelection: this.selectPicklistItem,
      ref: this.focusPicklist
    };

    return <Picklist {...attributes} />;
  }

  renderKebabButton() {
    const attributes = {
      className: 'component-edit-controls-kebab-btn',
      onClick: this.clickKebabButton,
      ref: (ref) => this.kebabButton = ref
    };

    return (
      <button {...attributes}>
        <span className="icon-kebab" />
      </button>
    );
  }

  render() {
    // NOTE: The same criteria apply for a component's ability to be reset, so
    // the MoveComponentStore check is doing double duty.
    const enabled = moveComponentStore.isComponentValidMoveSource(this.props.componentData.type);
    const kebabButton = enabled ? this.renderKebabButton() : null;
    const picklist = this.state.showPicklist ? this.renderPicklist() : null;

    return (
      <div className="component-edit-controls" ref={(ref) => this.componentEditControls = ref}>
        <button className="component-edit-controls-edit-btn" onClick={this.clickEditButton}>
          {I18n.t('editor.components.edit_controls.button')}
        </button>
        {kebabButton}
        {picklist}
      </div>
    );
  }
}

ComponentEditMenu.PropTypes = {
  componentData: PropTypes.shape({
    type: PropTypes.string.isRequired
  })
};

export default ComponentEditMenu;
