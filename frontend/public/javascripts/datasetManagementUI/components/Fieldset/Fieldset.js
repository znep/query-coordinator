import PropTypes from 'prop-types';
import React from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';

const Fieldset = ({ children, title, subtitle, closable, closeCallback, containerClass, legendClass }) => {
  let fsClasses = ['dsmp-fieldset']; // eslint-disable-line prefer-const
  let legendClasses = ['dsmp-tab-title']; // eslint-disable-line prefer-const

  if (containerClass) {
    fsClasses.push(containerClass);
  }

  if (legendClass) {
    legendClasses.push(legendClass);
  }

  return (
    <div id="fieldset">
      <fieldset className={fsClasses.join(' ')}>
        <legend className={legendClasses.join(' ')}>
          {title}
          {closable && (
            <SocrataIcon name="close-2" className="dsmp-close-button" onIconClick={closeCallback} />
          )}
        </legend>
        <span className="dsmp-tab-subtitle">{subtitle}</span>
        {children}
      </fieldset>
    </div>
  );
};

Fieldset.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.any,
  containerClass: PropTypes.string,
  legendClass: PropTypes.string,
  closable: PropTypes.bool,
  closeCallback: PropTypes.func
};

export default Fieldset;
