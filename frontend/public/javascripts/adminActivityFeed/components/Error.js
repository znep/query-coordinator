import React from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import LocalizedText from './Localization/LocalizedText';

class Error extends React.Component {

  render() {

    // We support only server error at the moment.
    // However there is room to support other error or alert types if necessary.
    const errorComponent = (
      <div className="server-error">
        <div className="alert error">
          <LocalizedText localeKey='index_page.server_error'/>
          <i className="socrata-icon-close" onClick={this.props.dismissError}/>
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
    dismissError: () => dispatch(actions.dismissError())
  };
};


export default connect(mapStateToProps, mapDispatchToProps)(Error);
