import React from 'react';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';

import ApprovalConfigurationHeader from './approval_configuration_header';
import OptionContainer from './option_container';

const AutoApproval = (props) => {
  // TODO: generally don't like that these are strings pasted in

  const sendToQueue = {
    optionName: 'pending',
    // TODO: if we changed the key below to 'send_to_queue', we could use some
    // sort of snake_case converter (lodash?) on the optionName to derive this
    // value, instead of having to specify. I wanted confirmation first, tho.
    translationKey: 'send_to_my_queue',
    withExplanation: false
  };

  const automaticallyApprove = {
    optionName: 'approved',
    translationKey: 'automatically_approve',
    withExplanation: true
  };

  const rejectAll = {
    optionName: 'rejected',
    translationKey: 'reject_all',
    withExplanation: true
  };

  const options = [sendToQueue, automaticallyApprove, rejectAll];

  return (
    <div className="approval-configuration">
      <ApprovalConfigurationHeader {...props} />
      <ul>
        {options.map((opt) =>
          <OptionContainer
            key={opt.optionName}
            {...props}
            translationKey={opt.translationKey}
            optionName={opt.optionName}
            withExplanation={opt.withExplanation} />
        )}
      </ul>
    </div>
  );
};

AutoApproval.propTypes = {
  scope: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['community', 'official']).isRequired,
  withExplanation: PropTypes.bool
};

export default AutoApproval;
