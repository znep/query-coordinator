/* eslint-disable */
import React from 'react';
import ReactDOM from 'react-dom';

import FilterContainer from './react-components/qfb/filtercontainer/FilterContainer.js';
/* eslint-enable */

(function() {
  'use strict';

  function handleBroadcast(filterObject) {
    $(document).trigger('appliedFilters.qfb.socrata', filterObject);
  }

  $(document).on('filterOps.qfb.socrata', function(e, opsData, domain, datasetId) {
    ReactDOM.render(<FilterContainer
      domain={ domain }
      datasetId={ datasetId }
      filterOps={opsData.filterOps}
      handleFilterBroadcast={ handleBroadcast } />, document.getElementById('filters'));
  });

})();
