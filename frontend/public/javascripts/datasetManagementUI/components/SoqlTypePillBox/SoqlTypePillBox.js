import PropTypes from 'prop-types';
import React from 'react';
import styles from './SoqlTypePillBox.module.scss';

const Translations = I18n.show_output_schema.column_header;

const SoqlTypePill = ({ name, handleClick, isSelected }) => {
  const classNames = [styles.pill];

  if (isSelected) {
    classNames.push(styles.selected);
  }

  return (
    <span className={classNames.join(' ')} onClick={handleClick}>
      {Translations.type_display_names[name.toLowerCase()]}
    </span>
  );
};

SoqlTypePill.propTypes = {
  name: PropTypes.string.isRequired,
  handleClick: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired
};

const SoqlTypePillBox = ({ transforms = {}, handleClick, currentTransform }) => {
  // sort them for alphabetical ordering but also for tests
  const pills = Object.keys(transforms)
    .sort()
    .map((key, idx) => (
      <SoqlTypePill
        name={key}
        key={idx}
        isSelected={transforms[key] === currentTransform}
        handleClick={() => handleClick(transforms[key])} />
    ));

  return (
    <div>
      <label>Type</label>
      {pills}
    </div>
  );
};

SoqlTypePillBox.propTypes = {
  transforms: PropTypes.object.isRequired,
  handleClick: PropTypes.func.isRequired,
  currentTransform: PropTypes.func.isRequired
};

export default SoqlTypePillBox;
