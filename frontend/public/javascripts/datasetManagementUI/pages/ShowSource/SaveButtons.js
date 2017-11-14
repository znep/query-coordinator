import React from 'react';
import PropTypes from 'prop-types';

const SaveButtons = ({ saveHrefForm, isDirty }) => (
  <div>
    <button onClick={saveHrefForm} disabled={!isDirty}>
      save
    </button>
  </div>
);

SaveButtons.propTypes = {
  saveHrefForm: PropTypes.func.isRequired,
  isDirty: PropTypes.bool.isRequired
};

export default SaveButtons;
