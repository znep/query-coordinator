import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import Tag from 'components/MetadataFields/Tag';
import classNames from 'classnames';
import styles from 'styles/MetadataFields/TagsInput.scss';

class TagsInput extends Component {
  constructor() {
    super();

    _.bindAll(this, ['handleChange', 'handleKeyPress', 'addTag', 'removeTag']);
  }

  handleChange(e) {
    e.preventDefault();

    const { name, value } = e.target;

    const { setProperty, setDirtyProperty } = this.props;

    setProperty(name, value);

    setDirtyProperty(name);
  }

  addTag(e) {
    e.preventDefault();

    const {
      removeDirtyProperty,
      setDirtyProperty,
      setModel,
      model,
      subName,
      schema,
      name
    } = this.props;

    // defaults to true if value does not exist, since that happens if no validation
    // exists for this field in the schema
    const isValid = _.get(schema, `fields.${name}.isValid`, true);

    if (!model[name] || !isValid) {
      return;
    }

    removeDirtyProperty(name);
    setDirtyProperty(subName);
    setModel({
      ...model,
      [subName]: model[subName].concat(model.tag),
      [name]: ''
    });
  }

  removeTag(tagName) {
    const { model, setModel, subName } = this.props;

    const newTags = model.tags.filter(tag => tag !== tagName);

    setModel({
      ...model,
      [subName]: newTags,
      [name]: ''
    });
  }

  handleKeyPress(e) {
    if (e.charCode === 13) {
      e.preventDefault();

      this.addTag(e);
    }
  }

  render() {
    const { placeholder, model, name, inErrorState, showErrors } = this.props;

    const classes = classNames(styles.textInput, { [styles.validationError]: inErrorState });

    const buttonClasses = classNames(styles.button, { [styles.validationError]: inErrorState });

    const listItems = model.tags
      ? model.tags.map((tag, idx) =>
        <Tag key={idx} tagName={tag} onTagClick={() => this.removeTag(tag)} />)
      : null;

    return (
      <div>
        <div className={styles.container}>
          <input
            onKeyPress={this.handleKeyPress}
            placeholder={placeholder}
            type="text"
            value={model[name] || ''}
            name={name}
            id={name}
            onBlur={showErrors}
            className={classes}
            onChange={this.handleChange} />
          <button onClick={this.addTag} className={buttonClasses}>
            {I18n.edit_metadata.add_btn}
          </button>
        </div>
        <ul className={styles.tagList}>
          {listItems}
        </ul>
      </div>
    );
  }
}

TagsInput.propTypes = {
  setProperty: PropTypes.func.isRequired,
  setModel: PropTypes.func.isRequired,
  setDirtyProperty: PropTypes.func.isRequired,
  removeDirtyProperty: PropTypes.func.isRequired,
  model: PropTypes.object.isRequired,
  schema: PropTypes.shape({
    fields: PropTypes.object,
    isValid: PropTypes.bool
  }),
  placeholder: PropTypes.string,
  name: PropTypes.string.isRequired,
  subName: PropTypes.string.isRequired,
  showErrors: PropTypes.func,
  inErrorState: PropTypes.bool
};

export default TagsInput;
