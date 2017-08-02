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

    const { setValue, onBlur, value } = this.props;

    onBlur();

    if (!this.state.tag) {
      return;
    }

    setValue([...value, this.state.tag]);

    this.setState({
      tag: ''
    });
  }

  removeTag(tagName) {
    const { value, setValue } = this.props;

    const idxToRemove = _.findIndex(value, val => val === tagName);

    const newTags = value.filter((tag, idx) => idx !== idxToRemove);

    setValue(newTags);
  }

  handleKeyPress(e) {
    if (e.charCode === 13) {
      e.preventDefault();

      this.addTag(e);
    }
  }

  render() {
    const { value, name, inErrorState, ...rest } = this.props;

    const classes = classNames(styles.textInput, { [styles.validationError]: inErrorState });

    const buttonClasses = classNames(styles.button, { [styles.validationError]: inErrorState });

    const listItems = value.map((tag, idx) =>
      <Tag key={idx} tagName={tag} onTagClick={() => this.removeTag(tag)} />
    );

    return (
      <div>
        <div className={styles.container}>
          <input
            {...rest}
            onKeyPress={this.handleKeyPress}
            type="text"
            value={this.state.tag}
            name={name}
            id={name}
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
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  isPrivate: PropTypes.bool.isRequired,
  isRequired: PropTypes.bool.isRequired,
  isCustom: PropTypes.bool.isRequired,
  inErrorState: PropTypes.bool.isRequired,
  setValue: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired
};

export default TagsInput;
