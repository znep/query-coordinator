import React, { PropTypes } from 'react';

/** sometimes you want to pass in an error message w/ HTML in it (e.g. a link)
 * but we don't want to dangerouslySetInnerHTML here, because sometimes error messages
 * accidentally have HTML in them (e.g. nginx returning an HTML 502 page from an API
 * that usually returns JSON); this puts the onus on the caller to escape any HTML
 * that might be in their error message.
 */
function flashMessage({ flashType, children }) {
  return (
    <div className={'flash-alert ' + flashType}>
      {children}
    </div>
  );
}

flashMessage.propTypes = {
  flashType: PropTypes.oneOf(['info', 'success', 'warning', 'error']).isRequired,
  children: PropTypes.oneOf([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element)
  ]).isRequired
};

export default flashMessage;
