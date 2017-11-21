import React from 'react';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';

const ApprovalConfigurationHeader = (props) => {
  const { translationScope, type } = props;

  const title = I18n.t(`automatic_approval.header.${type}`, { scope: translationScope });
  const iconName = {
    community: 'community',
    official: 'official2'
  }[type];

  return (
    <div className="configuration-title">
      <SocrataIcon name={iconName} />
      {title}
    </div>
  );
};

ApprovalConfigurationHeader.propTypes = {
  translationScope: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['community', 'official']).isRequired
};

export default ApprovalConfigurationHeader;
