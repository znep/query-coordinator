import _ from 'lodash';
import $ from 'jquery';
import React from 'react';

export var modalQuitEventHandler = ComposedComponent => class extends React.Component {
  constructor(props) {
    super(props);

    this.onWindowKeyUp = (event) => {
      var key = event.which || event.keyCode;

      // ESC
      if (key === 27) {
        this.handleNavigateAway();
      }
    };

    _.bindAll(this, [
      'onWindowKeyUp',
      'handleNavigateAway'
    ]);

  }

  componentDidMount() {
    $(window).on('keyup.modal.socrata', this.onWindowKeyUp);
    $(window).on('popstate.modal.socrata', this.handleNavigateAway);
    window.history.pushState({state: 'modal-open'}, '');
  }

  componentWillUnmount() {
    $(window).off('keyup.modal.socrata', this.onWindowKeyUp);
    $(window).off('popstate.modal.socrata');
    window.history.pushState({state: null}, '');
  }

  handleNavigateAway() {
    if (this.props.unsavedChanges) {
      if (confirm(this.props.translations.getIn(['admin', 'modal', 'close_without_save_message']))) {
        this.props.dismissModal();
      } else {
        // re-pushing state intentionally as confirm > cancel clears state
        window.history.pushState({state: 'modal-open'}, '');
      }
    } else {
      this.props.dismissModal();
    }
  }

  render() {
    return <ComposedComponent {...this.props} {...this.state} handleNavigateAway={ this.handleNavigateAway } />;
  }
};
