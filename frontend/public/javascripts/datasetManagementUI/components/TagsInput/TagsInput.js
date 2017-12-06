import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import Tag from 'components/Tag/Tag';
import styles from './TagsInput.scss';

class TagsInput extends Component {
  constructor() {
    super();

    this.state = {
      tag: ''
    };

    _.bindAll(this, ['handleTagChange', 'handleKeyPress', 'addTag', 'removeTag']);
  }

  handleTagChange(e) {
    e.preventDefault();

    this.setState({
      tag: e.target.value
    });
  }

  addTag(e) {
    e.preventDefault();

    const { handleAddTag, field } = this.props;

    const value = field.value || [];

    if (!this.state.tag) {
      return;
    }

    handleAddTag([...value, this.state.tag.toLowerCase()]);

    this.setState({
      tag: ''
    });
  }

  removeTag(tagName) {
    const { field, handleAddTag } = this.props;

    const value = field.value || [];

    const idxToRemove = _.findIndex(value, val => val === tagName);

    const newTags = value.filter((tag, idx) => idx !== idxToRemove);

    handleAddTag(newTags);
  }

  handleKeyPress(e) {
    if (e.charCode === 13) {
      e.preventDefault();

      this.addTag(e);
    }
  }

  render() {
    const { name, placeholder } = this.props.field;

    const value = this.props.field.value || [];

    const listItems = value.map((tag, idx) => (
      <Tag key={idx} tagName={tag} onTagClick={() => this.removeTag(tag)} />
    ));

    return (
      <div>
        <div className={styles.container}>
          <input
            onKeyPress={this.handleKeyPress}
            type="text"
            value={this.state.tag}
            name={name}
            id={name}
            placeholder={placeholder}
            className={styles.textInput}
            onChange={this.handleTagChange} />
          <button onClick={this.addTag} className={styles.button}>
            {I18n.edit_metadata.add_btn}
          </button>
        </div>
        {!!listItems.length && <ul className={styles.tagList}>{listItems}</ul>}
      </div>
    );
  }
}

TagsInput.propTypes = {
  field: PropTypes.object.isRequired,
  handleAddTag: PropTypes.func.isRequired
};

export default TagsInput;
