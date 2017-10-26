import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import ResourceToggle from './ResourceToggle';

class ODataModal extends PureComponent {
  getResourceTypes() {
    const { view } = this.props;

    const v2 = { label: 'OData V2', url: view.odataUrl };
    const v4 = { label: 'OData V4', url: view.odataUrlV4, defaultType: true };

    return [v2, v4];
  }

  render() {
    const { onClickCopy } = this.props;

    const toggleProps = {
      types: this.getResourceTypes(),
      section: 'odata',
      title: I18n.odata_modal.endpoint_title,
      onClickCopy
    };

    return (
      <div id="odata-modal" className="modal modal-overlay modal-hidden" data-modal-dismiss>
        <div className="modal-container">
          <header className="modal-header">
            <h2 className="h2 modal-header-title">{I18n.odata_modal.title}</h2>
            <button
              aria-label={I18n.close}
              className="btn btn-transparent modal-header-dismiss"
              data-modal-dismiss>
              <span className="icon-close-2" />
            </button>
          </header>

          <section className="modal-content odata-description">
            <p className="small">{I18n.odata_modal.description}</p>
          </section>

          <section className="modal-content">
            <a
              className="btn btn-default btn-sm documentation-link"
              href="https://dev.socrata.com/odata"
              target="_blank">
              <span className="icon-copy-document" />
              {I18n.odata_modal.developer_portal_button}
            </a>
          </section>

          <ResourceToggle {...toggleProps} />

          <footer className="modal-actions">
            <button className="btn btn-default btn-sm" data-modal-dismiss>
              {I18n.done}
            </button>
          </footer>
        </div>
      </div>
    );
  }
}

ODataModal.propTypes = {
  onClickCopy: PropTypes.func.isRequired,
  view: PropTypes.object.isRequired
};

export default ODataModal;
