import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';

export class PlotlyModal extends Component {

  render() {
    const { view, onClickPlotly } = this.props;

    return (
      <div
        role="dialog"
        aria-labelledby="plotly-modal-title"
        id="plotly-modal"
        className="modal modal-overlay modal-hidden"
        data-modal-dismiss>
        <div className="modal-container">
          <header className="modal-header">
            <h2 id="plotly-modal-title" className="h2 modal-header-title">
              {I18n.plotly_modal.title}
            </h2>

            <button
              aria-label={I18n.cancel}
              className="btn btn-transparent modal-header-dismiss"
              data-modal-dismiss>
              <span className="icon-close-2" />
            </button>
          </header>

          <section className="modal-content">
            {I18n.plotly_modal.modal_content}

            <div className="alert info">
              <span className="icon-info" />
              <div>{I18n.plotly_modal.alert}</div>
            </div>

            {I18n.plotly_modal.learn_more_link} <br />
            <a href="https://support.socrata.com/hc/en-us/articles/115010730868">
              https://support.socrata.com/hc/en-us/articles/115010730868
            </a>
          </section>

          <footer className="modal-actions">
            <a className="btn btn-default btn-sm" data-modal-dismiss>
              {I18n.close}
            </a>

            <a
              href={view.plotlyUrl}
              data-id={view.id}
              className="btn btn-primary btn-sm"
              onClick={onClickPlotly}>
              {I18n.open}
            </a>
          </footer>
        </div>
      </div>
    );
  }
}

PlotlyModal.propTypes = {
  onClickPlotly: PropTypes.func.isRequired,
  view: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

function mapDispatchToProps(dispatch) {
  return {
    onClickPlotly(event) {
      var payload = {
        name: 'Opened in Plotly',
        properties: {
          id: event.target.dataset.id
        }
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PlotlyModal);
