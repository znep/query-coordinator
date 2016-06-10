import React, { PropTypes } from 'react';

const generateButton = (buttonType, onUpdateHeadersCount) => {
  const I18nPrefixed = I18n.screens.dataset_new.import_columns;
  switch (buttonType) {
    case 'more':
      return (
        <a
          href="#more"
          className="button downArrow moreRowsButton"
          onClick={() => onUpdateHeadersCount(1)} >
          <span className="icon"></span>
          {I18nPrefixed.more_rows}
        </a>
      );
    case 'less':
      return (
        <a
          href="#less"
          className="button upArrow lessRowsButton"
          onClick={() => onUpdateHeadersCount(-1)} >
          <span className="icon"></span>
          {I18nPrefixed.fewer_rows}
        </a>
      );

    default:
      console.log('We should never get here!');
  }
};

export default (props) => {
  const { buttonType, onUpdateHeadersCount } = props;
  return generateButton(buttonType, onUpdateHeadersCount);
};
