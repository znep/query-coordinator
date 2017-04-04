import { expect, assert } from 'chai';
import TableCell from 'components/Table/TableCell';

describe('components/Table/TableCell', () => {

  // react spits out DOM validation warnings if you don't do this
  const renderInTable = (element) => (
    renderPureComponent(
      <table>
        <tbody>
          <tr>{element}</tr>
        </tbody>
      </table>
    )
  );

  it('renders empty', () => {
    const element = renderInTable(<TableCell cell={{ ok: null }} />);
    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.empty'));
  });

  it('renders not loaded', () => {
    const element = renderInTable(<TableCell cell={null} />);
    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.notYetLoaded'));
  });

  it('renders text', () => {
    const element = renderInTable(<TableCell cell={{ ok: 'foobar' }} />);
    assert.isNotNull(element);
    expect(element.querySelector('div').innerText).to.eql('foobar');
  });

  it('renders a boolean', () => {
    const element = renderInTable(<TableCell cell={{ ok: true }} />);
    assert.isNotNull(element);
    expect(element.querySelector('div').innerText).to.eql('true');
  });

  it('renders a number', () =>{
    const element = renderInTable(<TableCell cell={{ ok: 42 }} />);
    assert.isNotNull(element);
    expect(element.querySelector('div').innerText).to.eql('42');
  });

});
