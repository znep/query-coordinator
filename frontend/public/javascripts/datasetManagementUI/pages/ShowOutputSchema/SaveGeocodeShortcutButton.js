import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

const SaveGeocodeShortcutButton = ({ enabled }) => {
  return (
    <div>
      <label
        htmlFor="save-geocode-form"
        className={`btn btn-primary ${enabled ? '' : 'dsmp-disabled'}`}
        disabled={!enabled}>
        {I18n.home_pane.save_for_later}
      </label>
    </div>
  );
};

SaveGeocodeShortcutButton.propTypes = {
  enabled: PropTypes.bool.isRequired,
  desiredColumns: PropTypes.array
};


const mapStateToProps = state => {
  const form = state.ui.forms.geocodeShortcutForm;
  const desiredColumns = _.get(form, 'state.desiredColumns');
  const enabled = !!desiredColumns;

  return {
    enabled,
    desiredColumns
  };
};

export default connect(mapStateToProps)(SaveGeocodeShortcutButton);
