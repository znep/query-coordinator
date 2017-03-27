import React from 'react';
import { connect } from 'react-redux';
import { dismissError } from '../actions';
import LocalizedText from './Localization/LocalizedText';

class Error extends React.Component {

  render() {

    const { dispatchDismissError } = this.props;

    // We support only server error at the moment.
    // However there is room to support other error or alert types if necessary.
    const errorComponent = (
      <div className="server-error">
        <div className="alert error">
          <LocalizedText localeKey='index_page.server_error'/>
          <i className="socrata-icon-close" onClick={dispatchDismissError}/>
        </div>
      </div>
    );

    return this.props.error ? errorComponent : null;
  }
}

const mapStateToProps = (state) => ({
  error: state.get('error')
});

const mapDispatchToProps = (dispatch) => {
  return {
    dispatchDismissError: () => dispatch(dismissError())
  };
};


export default connect(mapStateToProps, mapDispatchToProps)(Error);
