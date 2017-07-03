import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import _ from 'lodash';
import Field from 'components/FormComponents/Field';
import * as Actions from 'actions/outputColumns';

const mapStateToProps = ({ entities, ui }) => {
  const { fourfour } = ui.routing;

  const errors = _.chain(entities)
    .get(`views.${fourfour}.columnMetadataErrors`, [])
    .map(error => error.message);

  const showErrors = !!entities.views[fourfour].showErrors;

  return { errors, showErrors };
};

const mergeProps = (stateProps, { dispatch }, ownProps) => {
  const id = _.toNumber(ownProps.field.name.split('-').reverse()[0]);

  return {
    ...stateProps,
    ...ownProps,
    setValue: value => dispatch(Actions.editOutputColumn(id, { payload: value }))
  };
};

export default connect(mapStateToProps, null, mergeProps)(Field);
