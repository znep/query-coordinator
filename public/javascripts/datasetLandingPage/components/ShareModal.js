import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';

export var ShareModal = function(props) {
  var { view, onClickOption } = props;

  var privateNotice = null;
  if (view.isPrivate) {
    privateNotice = (
      <section className="modal-content">
        <div className="alert info">
          <span dangerouslySetInnerHTML={{ __html: I18n.share.visibility_alert_html }} />
          {' '}
          <a
            href={`${view.gridUrl}?pane=manage`}
            target="_blank">
            {I18n.manage_prompt}
          </a>
        </div>
      </section>
    );
  }

  return (
    <div
      role="dialog"
      aria-labelledby="share-modal-title"
      id="share-modal"
      className="modal modal-overlay modal-hidden"
      data-modal-dismiss>
      <div className="modal-container">
        <header className="modal-header">
          <h2 id="share-modal-title" className="h2 modal-header-title">{I18n.share.title}</h2>
          <button
            aria-label={I18n.close}
            className="btn btn-transparent modal-header-dismiss"
            data-modal-dismiss>
            <span className="icon-close-2"></span>
          </button>
        </header>

        {privateNotice}

        <section className="modal-content">
          <div className="facebook">
            <a
              href={view.facebookShareUrl}
              data-share-option="Facebook"
              target="_blank"
              onClick={onClickOption}>
              <span className="icon-facebook"></span>
              {I18n.share.facebook}
            </a>
          </div>

          <div className="twitter">
            <a
              href={view.twitterShareUrl}
              data-share-option="Twitter"
              target="_blank"
              onClick={onClickOption}>
              <span className="icon-twitter"></span>
              {I18n.share.twitter}
            </a>
          </div>

          <div className="email">
            <a href={view.emailShareUrl} data-share-option="Email" onClick={onClickOption}>
              <span className="icon-email"></span>
              {I18n.share.email}
            </a>
          </div>
        </section>

        <footer className="modal-actions">
          <button className="btn btn-default btn-sm" data-modal-dismiss>
            {I18n.share.cancel}
          </button>
        </footer>
      </div>
    </div>
  );
};

ShareModal.propTypes = {
  onClickOption: PropTypes.func.isRequired,
  view: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

function mapDispatchToProps(dispatch) {
  return {
    onClickOption: function(event) {
      var payload = {
        name: 'Shared Dataset',
        properties: {
          'Provider': event.currentTarget.dataset.shareOption
        }
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShareModal);
