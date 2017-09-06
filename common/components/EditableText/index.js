import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import classNames from 'classnames';
import { ENTER, ESCAPE } from 'common/dom_helpers/keycodes';

/**
 * An editable text field. Renders as plain text until clicked, then becomes an editable input field.
 * When the user completes their edits (via the ENTER key, clicking outside the component, or other form-submitting actions),
 * the component reverts to plain text and calls back on the onTextChanged prop if the text has changed.
 */
export class EditableText extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isEditing: false,
      isHovering: false
    };

    _.bindAll(this,
      'acceptChangesAndCloseEditor',
      'renderEditMode',
      'renderViewMode'
    );
  }

  componentDidMount() {
    this.bodyClickHandler = (event) => {
      const isInside = this.container.contains(event.target);
      const { isEditing } = this.state;

      if (!isInside && isEditing) {
        this.acceptChangesAndCloseEditor();
      }
    }

    document.body.addEventListener('click', this.bodyClickHandler);
  }

  componentWillUnmount() {
    document.body.removeEventListener('click', this.bodyClickHandler);
  }

  acceptChangesAndCloseEditor() {
    const newText = this.input.value;
    const oldText = this.props.text;

    if (newText !== oldText) {
      this.props.onTextChanged(newText);
    }

    this.setState({
      isEditing: false,
      isHovering: false
    });
  }

  renderEditMode() {
    const { text } = this.props;

    const handleSubmit = (event) => {
      event.preventDefault();
      this.acceptChangesAndCloseEditor();
    };

    // NOTE: autoComplete is turned off because the generic
    //  name of the element could cause the browser to draw
    //  from too wide of a corpus of values.

    const props = {
      name: "text",
      autoComplete: "off",
      className: "editable-input",
      defaultValue: text,
      ref: (ref) => this.input = ref,
      onKeyDown: (event) => {
        if (event.keyCode === ESCAPE) {
          this.input.value = this.props.text;
          this.acceptChangesAndCloseEditor();
        }
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <input {...props} />
      </form>
    );
  }

  renderViewMode() {
    const { text } = this.props;
    const { isHovering } = this.state;

    const startEditing  = () => {
      this.setState({
        isEditing: true
      }, () => {
        this.input.select();
      });
    }

    const props = {
      className: classNames(
        'editable-text-display',
        {'highlight' : isHovering}
      ),
      onMouseOver: () => this.setState({ isHovering: true }),
      onMouseOut: () => this.setState({ isHovering: false }),
      onClick: (event) => {
        event.preventDefault();
        event.stopPropagation();

        startEditing();
      },
      onFocus: () => this.setState({ isHovering: true }),
      onBlur: () => this.setState({ isHovering: false }),
      onKeyUp: (e) => {
        if(!isHovering) return;
        if(e.keyCode === ENTER) {
          startEditing();
        }
      },
      tabIndex: 0
    };

    return (
      <div {...props}>
        <span className="editable-text-value">{text}</span>
        <div className="editable-text-btn">
          <span className="socrata-icon-edit" />
        </div>
      </div>
    );
  }

  render() {
    const { text } = this.props;

    const contents = this.state.isEditing ?
      this.renderEditMode() :
      this.renderViewMode();

    return(
      <div className="editable-text" ref={(ref) => this.container = ref}>
        {contents}
      </div>
    );
  }
}

EditableText.PropTypes = {
  text: PropTypes.string,
  onTextChanged: PropTypes.func.isRequired
};

export default EditableText;
