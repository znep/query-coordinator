import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import Tag from 'components/MetadataFields/Tag';

class TagsInput extends Component {
  constructor() {
    super();

    this.state = {
      tagName: ''
    };

    _.bindAll(this, ['handleChange', 'resetState', 'handleKeyPress', 'addTag', 'removeTag']);
  }

  resetState() {
    this.setState({
      tagName: ''
    });
  }

  handleChange(e) {
    e.preventDefault();

    this.setState({
      tagName: e.target.value
    });
  }

  addTag(e) {
    e.preventDefault();
    const { tags: currentTags } = this.props;

    // if textbox is empty or contains value that is already in list of tags
    // TODO: this currently fails silently, which is bad. Need to overhaul validations
    if (!this.state.tagName || currentTags.find(tag => tag === this.state.tagName)) {
      return false;
    }

    this.props.onChange(this.props.tags.concat([this.state.tagName]));

    this.resetState();
  }

  removeTag(tagName) {
    const { tags } = this.props;

    const newTags = tags.filter(tag => tag !== tagName);

    this.props.onChange(newTags);

    this.resetState();
  }

  handleKeyPress(e) {
    if (e.charCode === 13) {
      e.preventDefault();

      this.addTag(e);
    }
  }

  render() {
    const tags = this.props.tags || [];
    const { placeholder } = this.props;

    const listItems = tags.map((tag, idx) =>
      <Tag key={idx} tagName={tag} onTagClick={() => this.removeTag(tag)} />);

    return (
      <div>
        <div className="tag-input-container">
          <input
            onChange={this.handleChange}
            onKeyPress={this.handleKeyPress}
            value={this.state.tagName}
            placeholder={placeholder}
            type="text" />
          <button onClick={this.addTag} className="btn btn-default">Add +</button>
        </div>
        <ul className="tag-list">
          {listItems}
        </ul>
      </div>
    );
  }
}

TagsInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string)
};

export default TagsInput;
