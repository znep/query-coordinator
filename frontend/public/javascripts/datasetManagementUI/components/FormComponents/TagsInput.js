import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import Tag from 'components/FormComponents/Tag';
import classNames from 'classnames';
import styles from 'styles/FormComponents/TagsInput.scss';

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

    const { setValue, field, handleBlur } = this.props;

    handleBlur();

    if (!this.state.tag) {
      return;
    }

    setValue([...field.value, this.state.tag]);

    this.setState({
      tag: ''
    });
  }

  removeTag(tagName) {
    const { field, setValue } = this.props;

    const idxToRemove = _.findIndex(field.value, val => val === tagName);

    const newTags = field.value.filter((tag, idx) => idx !== idxToRemove);

    setValue(newTags);
  }

  handleKeyPress(e) {
    if (e.charCode === 13) {
      e.preventDefault();

      this.addTag(e);
    }
  }

  render() {
    const { field, inErrorState, handleBlur, handleFocus } = this.props;

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
            onBlur={handleBlur}
            onFocus={handleFocus}
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
  setValue: PropTypes.func.isRequired,
  handleBlur: PropTypes.func.isRequired,
  handleFocus: PropTypes.func.isRequired
};

export default TagsInput;