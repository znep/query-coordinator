import React from 'react';

export default class SocrataFlannel extends React.Component {
  render() {
    return (
      <div className="flannel flannel-left">
        <header className="flannel-header">
          <h1 className="flannel-header-title h5">{this.props.title}</h1>
          <button className="btn btn-transparent flannel-header-dismiss" onClick={this.props.onDismiss}>
            <span className="icon-close-2"/>
          </button>
        </header>
        <section className="flannel-content">
          <p>{this.props.content}</p>
        </section>
        <footer className="flannel-actions">
          <button className="btn btn-default btn-xs" onClick={this.props.onCancel || this.props.onDismiss}>Cancel</button>
          <button className="btn btn-primary btn-xs" onClick={this.props.onOkay || this.props.onDismiss}>OK</button>
        </footer>
      </div>
    );
  }
}

SocrataFlannel.propTypes = {
  title: React.PropTypes.string,
  content: React.PropTypes.string,
  onDismiss: React.PropTypes.func.isRequired,
  onCancel: React.PropTypes.func,
  onOkay: React.PropTypes.func
};
