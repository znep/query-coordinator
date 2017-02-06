import { DatasetPreview } from 'components/DatasetPreview';
import mockView from 'data/mockView';
import { Simulate } from 'react-addons-test-utils';
import $ from 'jquery';

describe('components/DatasetPreview', function() {
  let originalSocrataTable;
  let socrataTableStub;

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
    const element = renderComponent(DatasetPreview, getProps({
      view: { columns: [] }
    }));
    expect(element).to.not.exist;
  });

  it('does not render an element if the view has no rows', function() {
    const element = renderComponent(DatasetPreview, getProps({
      view: { rowCount: 0 }
    }));
    expect(element).to.not.exist;
  });

  it('does not render an element if the view is not tabular', function() {
    const element = renderComponent(DatasetPreview, getProps({
      view: { isTabular: false }
    }));
    expect(element).to.not.exist;
  });

  it('renders an element if the view is tabular', function() {
    const element = renderComponent(DatasetPreview, getProps());
    expect(element).to.exist;
  });

  describe('action button', () => {
    describe('when enableVisualizationCanvas is set to true', () => {
      beforeEach(() =>  {
        window.serverConfig.currentUser = { roleName: 'publisher' };
        window.serverConfig.featureFlags.enableVisualizationCanvas = true;
      });

      afterEach(() => {
        window.serverConfig.currentUser = null;
        window.serverConfig.featureFlags.enableVisualizationCanvas = false;
      });

      it('renders the visualize link if the bootstrapUrl is defined', () => {
        const element = renderComponent(DatasetPreview, getProps());
        expect(element.querySelector('a[href="bootstrapUrl"]')).to.exist;
      });

      it('does not render the grid view link', () => {
        const element = renderComponent(DatasetPreview, getProps());
        expect(element.querySelector('a.btn-grid')).to.not.exist;
      });

      describe('when the bootstrapUrl is blank', () => {
        let element;

        beforeEach(() => {
          element = renderComponent(DatasetPreview, getProps({
            view: {
              ...mockView,
              bootstrapUrl: null
            }
          }));
        });

        it('does not render the visualize link', () => {
          expect(element.querySelector('a[href="bootstrapUrl"]')).to.not.exist;
        });

        it('renders the grid view link', () => {
          expect(element.querySelector('a.btn-grid')).to.exist;
        });
      });
    });

    describe('when enableVisualizationCanvas is set to false', () => {
      beforeEach(() => {
        window.serverConfig.featureFlags.enableVisualizationCanvas = false;
      });

      it('renders the grid view link', function() {
        const element = renderComponent(DatasetPreview, getProps());
        expect(element.querySelector('a.btn-grid')).to.exist;
      });

      it('does not render the visualize link', () => {
        const element = renderComponent(DatasetPreview, getProps());
        expect(element.querySelector('a[href="bootstrapUrl"]')).to.not.exist;
      });
    });
  });

  it('invokes onClickGrid when clicking the grid view link', function() {
    const spy = sinon.spy();
    const element = renderComponent(DatasetPreview, getProps({
      onClickGrid: spy
    }));

    Simulate.click(element.querySelector('a.btn-grid'));

    expect(spy).to.have.been.called;
  });

  it('shows a spinner on first load', function() {
    const element = renderComponent(DatasetPreview, getProps());
    expect(element.querySelector('.spinner-default')).to.exist;
  });

  it('invokes $.fn.socrataTable', function() {
    const element = renderComponent(DatasetPreview, getProps());
    expect(socrataTableStub).to.have.been.called;
  });

  it('hides the spinner once the table is loaded', function() {
    const $element = $(renderComponent(DatasetPreview, getProps()));
    const $table = $element.find('#table-container');

    $table.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');

    expect($element.find('.spinner-default').length).to.eq(0);
  });
});
