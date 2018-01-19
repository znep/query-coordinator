import { assert } from 'chai';
import sinon from 'sinon';
import Table from 'visualizationCanvas/components/Table';

describe('Table', () => {
  let element;

  beforeEach(() => {
    sinon.stub($.fn, 'socrataTable');
    element = renderComponentWithStore(Table, {});
  });

  afterEach(() => {
    $.fn.socrataTable.restore();
  });

  it('renders an element', () => {
    assert.ok(element);
  });

  it('renders a table', () => {
    sinon.assert.calledOnce($.fn.socrataTable);
  });
});
