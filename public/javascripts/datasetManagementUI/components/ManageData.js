import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

export function ManageData({ metadata }) {
  console.log(metadata);
  return (
    <div
      id="manage-data-modal"
      className="modal modal-full modal-overlay modal-hidden"
      data-modal-dismiss>
      <div className="modal-container">
        <header className="modal-header">
          <h1 className="modal-header-title">{I18n.home_pane.data}</h1>
          <button className="btn btn-transparent modal-header-dismiss" data-modal-dismiss>
            <span className="icon-close-2" aria-label={I18n.common.cancel}></span>
          </button>
        </header>

        <section className="modal-content">
          Meow!
        </section>

        <footer className="modal-footer">
          <div className="modal-footer-actions">
            <button className="btn btn-default" data-modal-dismiss>{I18n.common.cancel}</button>
            <button
              className="btn btn-primary"
              onClick={console.log('save!')}
              data-modal-dismiss>
              {I18n.common.save}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}

ManageData.propTypes = {
  metadata: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'metadata');
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageData);
