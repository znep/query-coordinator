import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';

export class CartoModal extends Component {

  render() {
    const { view, onClickCarto } = this.props;

    return (
      <div
        role="dialog"
        aria-labelledby="carto-modal-title"
        id="carto-modal"
        className="modal modal-overlay modal-hidden"
        data-modal-dismiss>
        <div className="modal-container">
          <header className="modal-header">
            <h2 id="carto-modal-title" className="h2 modal-header-title">
              {I18n.carto_modal.title}
            </h2>

            <button
              aria-label={I18n.cancel}
              className="btn btn-transparent modal-header-dismiss"
              data-modal-dismiss>
              <span className="icon-close-2" />
            </button>
          </header>

          <section className="modal-content">
            {I18n.carto_modal.modal_content}

            <div className="alert info">
              <span className="icon-info" />
              <span>{I18n.carto_modal.alert}</span>
            </div>

            {I18n.carto_modal.learn_more_link} <br />
            <a href="https://support.socrata.com/hc/en-us/articles/115010730868">
              https://support.socrata.com/hc/en-us/articles/115010730868
            </a>
          </section>

          <footer className="modal-actions">
            <a className="btn btn-default btn-sm" data-modal-dismiss>
              {I18n.close}
            </a>

            <a
              href={view.cartoUrl}
              data-id={view.id}
              className="btn btn-primary btn-sm"
              onClick={onClickCarto}>
              {I18n.open}
            </a>
          </footer>
        </div>
      </div>
    );
  }
}

CartoModal.propTypes = {
  onClickCarto: PropTypes.func.isRequired,
  view: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

function mapDispatchToProps(dispatch) {
  return {
    onClickCarto(event) {
      var payload = {
        name: 'Opened in Carto',
        properties: {
          id: event.target.dataset.id
        }
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CartoModal);
