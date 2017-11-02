import React from 'react';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';

const ApprovalConfigurationOption = (props) => {
  const {
    translationKey,
    onOptionChange,
    optionName,
    presetStates,
    translationScope,
    type,
    withExplanation
  } = props;

  // Helpers
  const idFor = (optionName) => `approval-configuration-${type}-${optionName}`;
  const isChecked = presetStates[type] === optionName;
  const onChange = () => onOptionChange(type, optionName);

  const explanation = withExplanation ?
    <div className="explanation">
      {I18n.t('automatic_approval.explanation', { scope: translationScope })}
    </div> :
    null;

  const radioButton = (optionName) => {
    return (
      <div>
        <input
          type="radio"
          id={idFor(optionName)}
          name={`approval-configuration-${type}`}
          onChange={onChange}
          checked={isChecked} />
      </div>
    );
  };

  return (
    <li>
      {radioButton(optionName)}
      <div>
        <label className="radioLabel" htmlFor={idFor(optionName)}>
          {I18n.t(`automatic_approval.${translationKey}`, { scope: translationScope })}
          {explanation}
        </label>
      </div>
    </li>
  );
};

ApprovalConfigurationOption.propTypes = {
  translationKey: PropTypes.string.isRequired,
  onOptionChange: PropTypes.func.isRequired,
  optionName: PropTypes.string.isRequired,
  presetStates: PropTypes.object.isRequired,
  translationScope: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  withExplanation: PropTypes.bool
};

export default ApprovalConfigurationOption;
