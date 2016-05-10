import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

export var ShareModal = React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired
  },

  render: function() {
    var { view } = this.props;

    var privateNotice = null;
    if (view.isPrivate) {
      privateNotice = (
        <section className="modal-content">
          <div className="alert info">
            <span dangerouslySetInnerHTML={{__html: I18n.share.visibility_alert_html}}/>
            {' '}
            <a href={`/dataset/${view.id}?pane=manage&enable_dataset_landing_page=false`} target="_blank">
              {I18n.manage_prompt}
            </a>
          </div>
        </section>
      );
    }

    return (
      <div id="share-modal" className="modal modal-overlay modal-hidden" data-modal-dismiss>
        <div className="modal-container">
          <header className="modal-header">
            <h5 className="h5 modal-header-title">{I18n.share.title}</h5>
            <button className="btn btn-transparent modal-header-dismiss" data-modal-dismiss>
              <span className="icon-close-2"></span>
            </button>
          </header>

          {privateNotice}

          <section className="modal-content">
            <div className="facebook">
              <a href={view.facebookShareUrl} target="_blank">
                <span className="icon-facebook"></span>
                {I18n.share.facebook}
              </a>
            </div>

            <div className="twitter">
              <a href={view.twitterShareUrl} target="_blank">
                <span className="icon-twitter"></span>
                {I18n.share.twitter}
              </a>
            </div>

            <div className="email">
              <a href={view.emailShareUrl}>
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
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(ShareModal);
