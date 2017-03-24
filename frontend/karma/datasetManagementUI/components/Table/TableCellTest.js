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
    expect(element).to.not.be.null;
    expect(element.querySelector('.empty')).to.not.be.null;
  });

  it('renders not loaded', () => {
    const element = renderInTable(<TableCell cell={null} />);
    expect(element).to.not.be.null;
    expect(element.querySelector('.not-yet-loaded')).to.not.be.null;
  });

  it('renders text', () => {
    const element = renderInTable(<TableCell cell={{ ok: 'foobar' }} />);
    expect(element).to.not.be.null;
    expect(element.querySelector('div').innerText).to.eql('foobar');
  });

  it('renders a boolean', () => {
    const element = renderInTable(<TableCell cell={{ ok: true }} />);
    expect(element).to.not.be.null;
    expect(element.querySelector('div').innerText).to.eql('true');
  });

  it('renders a number', () =>{
    const element = renderInTable(<TableCell cell={{ ok: 42 }} />);
    expect(element).to.not.be.null;
    expect(element.querySelector('div').innerText).to.eql('42');
  });

});
