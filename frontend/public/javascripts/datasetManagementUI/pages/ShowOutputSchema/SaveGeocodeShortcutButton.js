import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { NEW_OUTPUT_SCHEMA } from 'reduxStuff/actions/apiCalls';
import ApiCallButton from 'containers/ApiCallButtonContainer';
import * as Selectors from 'selectors';

const SaveGeocodeShortcutButton = ({
  enabled,
  onClick,
  desiredColumns
}) => {
  return (
    <div>
      <ApiCallButton
        forceDisable={!enabled}
        onClick={onClick}
        operation={NEW_OUTPUT_SCHEMA}
        callParams={{ desiredColumns }}>
          {I18n.home_pane.save_for_later}
      </ApiCallButton>
    </div>
  );
};

SaveGeocodeShortcutButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  enabled: PropTypes.bool.isRequired,
  desiredColumns: PropTypes.array
};


const mapStateToProps = (state, ownProps) => {
  const form = state.ui.forms.geocodeShortcutForm;
  const desiredColumns = form && form.state && form.state.desiredColumns;

  const enabled = !!desiredColumns;
  let onClick = _.noop;

  if (enabled) {
    const outputColumns = Selectors.columnsForOutputSchema(state.entities, ownProps.outputSchema.id);

    const desiredTransforms = _.sortBy(desiredColumns.map(oc => oc.transform.transform_expr));
    const actualTransforms = _.sortBy(outputColumns.map(oc => oc.transform.transform_expr));
    const saveRequired = !_.every(_.zip(desiredTransforms, actualTransforms).map(([d, a]) => d === a));
    // Lodash documentation says this *should* be equivalent to the above line, but it's not
    // const saveRequired = !_.isEqual(desiredColumns, actualTransforms);

    if (saveRequired) {
      onClick = () => ownProps.newOutputSchema(desiredColumns).then(({ resource }) => {
        ownProps.redirectToOutputSchema(resource.id);
      });
    } else {
      onClick = () => ownProps.redirectToOutputSchema(ownProps.outputSchema.id);
    }
  }

  return {
    onClick,
    enabled,
    desiredColumns
  };
};

export default connect(mapStateToProps)(SaveGeocodeShortcutButton);
