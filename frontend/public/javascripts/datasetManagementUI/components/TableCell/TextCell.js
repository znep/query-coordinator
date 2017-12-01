/* eslint react/no-multi-comp: 0 */
/* eslint react/prop-types: 0 */
import PropTypes from 'prop-types';
import TypedCell from './TypedCell';
import React from 'react';

const propTypes = {
  isDropping: PropTypes.bool,
  value: PropTypes.string,
  format: PropTypes.shape({
    displayStyle: PropTypes.string
  })
};

function TextCell(props) {
  return (<TypedCell {...props} />);
}
TextCell.propTypes = propTypes;


function UrlCell({ isDropping, format, value }) {
  const link = (<a href={value}>{value}</a>);

  return (<TypedCell
    isDropping={isDropping}
    value={link}
    format={format} />);
}
UrlCell.propTypes = propTypes;

function EmailCell({ isDropping, format, value }) {
  const link = (<a href={`mailto:${value}`}>{value}</a>);

  return (<TypedCell
    isDropping={isDropping}
    value={link}
    format={format} />);
}
EmailCell.propTypes = propTypes;


const renderTypeMap = {
  url: UrlCell,
  email: EmailCell
};

export default function renderText(props) {
  return React.createElement(renderTypeMap[props.format.displayStyle] || TextCell, props);
}
