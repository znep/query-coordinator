import React from 'react';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';

const Introduction = (props) => {
  const { translationScope } = props;

  return (
    <div className="introduction">
      <div className="section-title">
        {I18n.t('introduction.header', { scope: translationScope })}
      </div>
      <p className="first-paragraph">{I18n.t('introduction.paragraph_1', { scope: translationScope })}</p>
      <p className="second-paragraph">{I18n.t('introduction.paragraph_2', { scope: translationScope })}</p>
    </div>
  );
};

Introduction.propTypes = {
  translationScope: PropTypes.string.isRequired
};

export default Introduction;
