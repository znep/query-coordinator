import _ from 'lodash';
import $ from 'jquery';

import renderComponent from '../renderComponent';
import { TableView } from 'common/authoring_workflow/components/TableView';
import vifs from 'common/authoring_workflow/vifs';

function defaultProps() {
  var vifsCloned = vifs();

  return {
    metadata: {
      data: null,
      datasetUid: 'test-test',
      domain: 'example.com',
    },
    vif: vifsCloned.table
  }
};

// Replace chart implementations
// with Sinon stubs.
function stubTable() {
  var originalTableImplementation;

  beforeEach(function() {
    originalTableImplementation = $.fn.socrataTable;
    $.fn.socrataTable = sinon.stub();
  });

  afterEach(function() {
    $.fn.socrataTable = originalTableImplementation;
  });
}

function rendersTable(props) {

  it('calls $.fn.socrataTable', function() {
    renderComponent(TableView, props);
    sinon.assert.calledOnce($.fn.socrataTable);
  });
}

describe('TableView', function() {
  stubTable();

  it('with an invalid vif renders an empty <div>', function() {
    var element = renderComponent(TableView, _.set(defaultProps(), 'vif', {}));

    expect(element.querySelector('.authoring-table-view')).to.be.empty;
  });

  it('with no metadata renders an empty <div>', function() {
    var element = renderComponent(TableView, _.set(defaultProps(), 'metadata.data', undefined));

    expect(element.querySelector('.authoring-table-view')).to.be.empty;
  });

  describe('with a valid vif', function() {
    var props = defaultProps();

    _.set(
      props,
      'metadata',
      {
        data: { id: 'test-test', columns: [] },
        curatedRegions: {}
      }
    );
    rendersTable(props);
  });
});
