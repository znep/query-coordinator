import { assert } from 'chai';
import Table from 'components/Table';

describe('Table', () => {
  let element;

  beforeEach(() => {
    element = renderComponentWithStore(Table, {});
  });

  it('renders an element', () => {
    assert.ok(element);
  });

  it('renders a table', () => {
    sinon.assert.calledOnce($.fn.socrataTable);
  });
});
