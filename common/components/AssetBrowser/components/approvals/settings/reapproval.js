import React from 'react';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';

const Reapproval = (props) => {
  const { translationScope, reapprovalPolicy } = props;
  // TODO: hard-coded
  const checked = reapprovalPolicy === 'manual';
  const toggleReapproval = () => props.onReapprovalClick();

  return (
    <div className="checkboxWrapper">
      <div>
        <input
          type="checkbox"
          id="approval-configuration-reapproval"
          name="approval-configuration-reapprove"
          onChange={toggleReapproval}
          checked={checked} />
      </div>
      <label htmlFor="approval-configuration-reapproval">
        {I18n.t('automatic_approval.require_on_republish', { scope: translationScope })}
      </label>
    </div>
  );
};

Reapproval.propTypes = {
  onReapprovalClick: PropTypes.func.isRequired,
  reapprovalPolicy: PropTypes.oneOf(['manual', 'auto']).isRequired,
  translationScope: PropTypes.string.isRequired
};

export default Reapproval;
