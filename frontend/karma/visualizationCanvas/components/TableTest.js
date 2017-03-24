import Table from 'components/Table';

describe('Table', () => {
  let element;

  beforeEach(() => {
    element = renderComponentWithStore(Table, {});
  });

  it('renders an element', () => {
    expect(element).to.exist;
  });

  it('renders a table', () => {
    expect(element.querySelector('.socrata-table')).to.exist;
  });
});
