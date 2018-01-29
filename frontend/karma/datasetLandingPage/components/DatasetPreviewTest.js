import sinon from 'sinon';
import { expect, assert } from 'chai';
import { DatasetPreview } from 'datasetLandingPage/components/DatasetPreview';
import mockView from '../data/mockView';
import { Simulate } from 'react-dom/test-utils';

describe('components/DatasetPreview', function() {
  function getProps(props) {
    return _.defaults({}, props, {
      onClickGrid: _.noop,
      view: mockView,
      vif: {}
    });
  }

  it('does not render an element if the view has no columns', function() {
    const element = renderComponent(DatasetPreview, getProps({
      view: { columns: [] }
    }));
    assert.isNull(element);
  });

  it('does not render an element if the view has no rows', function() {
    const element = renderComponent(DatasetPreview, getProps({
      view: { rowCount: 0 }
    }));
    assert.isNull(element);
  });

  it('does not render an element if the view is not tabular', function() {
    const element = renderComponent(DatasetPreview, getProps({
      view: { isTabular: false }
    }));
    assert.isNull(element);
  });

  it('renders an element if the view is tabular', function() {
    const element = renderComponent(DatasetPreview, getProps());
    assert.ok(element);
  });

  describe('action button', () => {
    describe('when the user is logged in', () => {
      beforeEach(() =>  {
        window.serverConfig.currentUser = { roleName: 'anything' };
      });

      afterEach(() => {
        window.serverConfig.currentUser = null;
      });

      it('renders the visualize link if the bootstrapUrl is defined', () => {
        const element = renderComponent(DatasetPreview, getProps());
        assert.ok(element.querySelector('a[href="bootstrapUrl"]'));
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
          assert.isNull(element.querySelector('a[href="bootstrapUrl"]'));
        });

        it('renders the grid view link', () => {
          assert.ok(element.querySelector('a.btn-grid'));
        });
      });
    });

    describe('when the user is not logged in', () => {
      beforeEach(() => {
        window.serverConfig.currentUser = null;
      });

      it('renders the visualize link if the bootstrapUrl is defined', () => {
        const element = renderComponent(DatasetPreview, getProps());
        assert.ok(element.querySelector('a.btn-visualize[href="bootstrapUrl"]'));
      });
    });
  });

  it('invokes onClickGrid when clicking the grid view link', function() {
    const spy = sinon.spy();
    const element = renderComponent(DatasetPreview, getProps({
      onClickGrid: spy
    }));

    Simulate.click(element.querySelector('a.btn-grid'));

    sinon.assert.called(spy);
  });
});
