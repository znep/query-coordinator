import React from 'react';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';

const Approvers = (props) => {
  // TODO: implement users
  const { translationScope } = props;

  return (
    <div className="approver-configuration">
      <div className="section-title">
        {I18n.t('approver_configuration.header', { scope: translationScope })}
      </div>
      <p
        dangerouslySetInnerHTML={{
          __html: I18n.t(
            'approver_configuration.paragraph_1',
            { link: '/admin/users', scope: translationScope }
          )
        }} />
    </div>
  );
};

Approvers.propTypes = {
  translationScope: PropTypes.string.isRequired
};

export default Approvers;
