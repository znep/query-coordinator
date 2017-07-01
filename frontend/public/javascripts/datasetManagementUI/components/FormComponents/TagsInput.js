import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import Tag from 'components/MetadataFields/Tag';
import classNames from 'classnames';
import styles from 'styles/MetadataFields/TagsInput.scss';

class TagsInput extends Component {
  constructor() {
    super();

    this.state = {
      tag: ''
    };

    _.bindAll(this, ['handleChange', 'handleKeyPress', 'addTag', 'removeTag']);
  }

  handleChange(e) {
    e.preventDefault();

    this.setState({
      tag: e.target.value
    });
  }

  addTag(e) {
    e.preventDefault();

    const { setValue, field } = this.props;

    // TODO: make sure it's valid before adding
    setValue([this.state.tag, ...field.value]);

    this.setState({
      tag: ''
    });
  }

  removeTag(tagName) {
    const { field, setValue } = this.props;

    const newTags = field.value.filter(tag => tag !== tagName);

    setValue(newTags);
  }

  handleKeyPress(e) {
    if (e.charCode === 13) {
      e.preventDefault();

      this.addTag(e);
    }
  }

  render() {
    const { field, inErrorState } = this.props;

    const classes = classNames(styles.textInput, { [styles.validationError]: inErrorState });

    const buttonClasses = classNames(styles.button, { [styles.validationError]: inErrorState });

    const listItems = field.value.map((tag, idx) =>
      <Tag key={idx} tagName={tag} onTagClick={() => this.removeTag(tag)} />
    );

    return (
      <div>
        <div className={styles.container}>
          <input
            onKeyPress={this.handleKeyPress}
            placeholder={field.placeholder}
            type="text"
            value={this.state.tag}
            name={field.name}
            id={field.name}
            className={classes}
            onChange={this.handleChange} />
          <button onClick={this.addTag} className={buttonClasses}>
            {I18n.edit_metadata.add_btn}
          </button>
        </div>
        {!!listItems.length &&
          <ul className={styles.tagList}>
            {listItems}
          </ul>}
      </div>
    );
  }
}

TagsInput.propTypes = {
  field: PropTypes.object.isRequired,
  inErrorState: PropTypes.bool.isRequired,
  setValue: PropTypes.func.isRequired
};

export default TagsInput;
