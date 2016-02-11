/* eslint-disable */
import React from 'react';
import ReactDOM from 'react-dom';

import FilterContainer from './react-components/qfb/filtercontainer/FilterContainer.js';
/* eslint-enable */

(function() {
  'use strict';

  function handleBroadcast(filterObject) {
    $(document).trigger('socrata/qfb/appliedFilters', filterObject);
  }

  $(document).on('socrata/qfb/filterOps', function(e, opsData, domain, datasetId) {
    ReactDOM.render(<FilterContainer
      domain={ domain }
      datasetId={ datasetId }
      filterOps={opsData.filterOps}
      handleFilterBroadcast={ handleBroadcast } />, document.getElementById('filters'));
  });

})();
