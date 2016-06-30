import { DatasetPreview } from 'components/DatasetPreview';
import mockView from 'data/mockView';
import { Simulate } from 'react-addons-test-utils';
import $ from 'jquery';

describe('components/DatasetPreview', function() {
  var originalSocrataTable;
  var socrataTableStub;

  function getProps(props) {
    return _.defaults({}, props, {
      onClickGrid: _.noop,
      view: mockView
    });
  }

  beforeEach(function() {
    originalSocrataTable = $.fn.socrataTable;
    socrataTableStub = sinon.stub();

    $.fn.socrataTable = socrataTableStub;
  });

  afterEach(function() {
    $.fn.socrataTable = originalSocrataTable;
  });

  it('does not render an element if the view has no columns', function() {
    var element = renderComponent(DatasetPreview, getProps({
      view: { columns: [] }
    }));
    expect(element).to.not.exist;
  });

  it('does not render an element if the view has no rows', function() {
    var element = renderComponent(DatasetPreview, getProps({
      view: { rowCount: 0 }
    }));
    expect(element).to.not.exist;
  });

  it('does not render an element if the view is not tabular', function() {
    var element = renderComponent(DatasetPreview, getProps({
      view: { isTabular: false }
    }));
    expect(element).to.not.exist;
  });

  it('does not render an element if defaultToDatasetLandingPage is false', function() {
    serverConfig.featureFlags.defaultToDatasetLandingPage = false;
    var element = renderComponent(DatasetPreview, getProps());
    expect(element).to.not.exist;
    serverConfig.featureFlags.defaultToDatasetLandingPage = true;
  });

  it('renders an element if the view is tabular', function() {
    var element = renderComponent(DatasetPreview, getProps());
    expect(element).to.exist;
  });

  it('renders a link to the grid view', function() {
    var element = renderComponent(DatasetPreview, getProps());
    expect(element.querySelector('a.grid')).to.exist;
  });

  it('invokes onClickGrid when clicking the grid view link', function() {
    var spy = sinon.spy();
    var element = renderComponent(DatasetPreview, getProps({
      onClickGrid: spy
    }));

    Simulate.click(element.querySelector('a.grid'));

    expect(spy).to.have.been.called;
  });

  it('shows a spinner on first load', function() {
    var element = renderComponent(DatasetPreview, getProps());
    expect(element.querySelector('.spinner-default')).to.exist;
  });

  it('invokes $.fn.socrataTable', function() {
    var element = renderComponent(DatasetPreview, getProps());
    expect(socrataTableStub).to.have.been.called;
  });

  it('hides the spinner once the table is loaded', function() {
    var $element = $(renderComponent(DatasetPreview, getProps()));
    var $table = $element.find('#table-container');

    $table.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');

    expect($element.find('.spinner-default').length).to.eq(0);
  });
});
