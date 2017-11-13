import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import * as ModalActions from 'reduxStuff/actions/modal';
import * as FlashActions from 'reduxStuff/actions/flashMessage';
import * as ShowActions from 'reduxStuff/actions/showOutputSchema';
import { COLUMN_OPERATIONS } from 'reduxStuff/actions/apiCalls';
import { STATUS_CALL_IN_PROGRESS } from 'lib/apiCallStatus';
import ColumnHeader from 'components/ColumnHeader/ColumnHeader';

function activeApiCallInvolvingThis(apiCalls, column) {
  const apiCallsByColumnId = _.chain(apiCalls)
    .filter(call => _.includes(COLUMN_OPERATIONS, call.operation) && call.status === STATUS_CALL_IN_PROGRESS)
    .keyBy('params.outputColumnId')
    .value();

  return _.has(apiCallsByColumnId, column.id);
}

const mapStateToProps = ({ ui }, { outputColumn }) => {
  return {
    activeApiCallInvolvingThis: activeApiCallInvolvingThis(ui.apiCalls, outputColumn)
  };
};

const mergeProps = (stateProps, { dispatch }, ownProps) => {
  const { params, outputSchema, outputColumn } = ownProps;

  function RedirectError() {
    this.name = 'RedirectError';
    this.message = I18n.show_output_schema.redirect_error;
  }

  RedirectError.prototype = new Error();

  const redirectToNewOutputschema = resp => {
    if (resp && resp.resource) {
      dispatch(ShowActions.redirectToOutputSchema(params, resp.resource.id));
    } else {
      throw new RedirectError();
    }
  };

  const dispatchProps = {
    dropColumn: () => {
      ownProps.setDropping();
      return dispatch(ShowActions.dropColumn(outputSchema, outputColumn))
        .then(redirectToNewOutputschema)
        .then(ownProps.resetDropping)
        .catch(e => {
          if (e.name === 'RedirectError') {
            dispatch(FlashActions.showFlashMessage('error', e.message));
          } else {
            dispatch(
              FlashActions.showFlashMessage('error', I18n.show_output_schema.fatal_error.unknown_error)
            );
          }
        });
    },

    updateColumnType: (oldSchema, oldColumn, newType) =>
      dispatch(ShowActions.updateColumnType(oldSchema, oldColumn, newType)).then(redirectToNewOutputschema),

    validateThenSetRowIdentifier: () =>
      dispatch(ShowActions.validateThenSetRowIdentifier(outputSchema, outputColumn)).then(
        redirectToNewOutputschema
      ),

    unSetRowIdentifier: () =>
      dispatch(ShowActions.unsetRowIdentifier(outputSchema)).then(redirectToNewOutputschema),

    moveLeft: () =>
      dispatch(ShowActions.moveColumnToPosition(outputSchema, outputColumn, outputColumn.position - 1)).then(
        redirectToNewOutputschema
      ),

    moveRight: () =>
      dispatch(ShowActions.moveColumnToPosition(outputSchema, outputColumn, outputColumn.position + 1)).then(
        redirectToNewOutputschema
      ),

    formatColumn: () =>
      dispatch(
        ModalActions.showModal('FormatColumn', {
          outputSchema,
          outputColumn,
          params
        })
      )
  };

  return { ...stateProps, ...dispatchProps, ...ownProps };
};

export default withRouter(connect(mapStateToProps, null, mergeProps)(ColumnHeader));
