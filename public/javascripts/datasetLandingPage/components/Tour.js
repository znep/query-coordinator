import utils from 'socrata-utils';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';

export var Tour = function(props) {
  var { onClickDone, onCloseTour } = props;

  var { enableDatasetLandingPageTour } = window.serverConfig.featureFlags;
  var hasCookie = utils.getCookie('dslpTourClosed');

  if (enableDatasetLandingPageTour && !hasCookie) {
    var setCookie = function() {
      window.document.cookie = 'dslpTourClosed=1';
    };

    window.document.addEventListener(
      'SOCRATA_STYLEGUIDE_TOUR_COMPLETE',
      function() {
        onClickDone();
        setCookie();
      }
    );

    window.document.addEventListener(
      'SOCRATA_STYLEGUIDE_TOUR_CLOSED',
      function() { onCloseTour(); }
    );

    return (
      <div data-tour data-tour-name="grid-view-button-tour" data-tour-done={I18n.tour.done}>
        <div
          data-tour-step
          data-step-number="1"
          data-attach-to-element="#tour-anchor"
          data-attach-to-position="bottom">
          <h3>{I18n.tour.title}</h3>
          <p>{I18n.tour.description}</p>
        </div>
      </div>
    );
  } else {
    return <div />;
  }
};

Tour.propTypes = {
  onClickDone: PropTypes.func,
  onCloseTour: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  function tourPayload() {
    return {
      'Tour': 'DSLP Tour',
      'Step in Tour': '1',
      'Total Steps in Tour': '1'
    };
  }

  return {
    onClickDone: function() {
      var payload = {
        name: 'Clicked Next in Tour',
        properties: tourPayload()
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onCloseTour: function() {
      var payload = {
        name: 'Closed Tour',
        properties: tourPayload()
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(null, mapDispatchToProps)(Tour);
