import { EditBar } from 'components/EditBar';

describe('EditBar', () => {
  const getProps = (props) => {
    return {
      name: 'wombats',
      menuLabel: 'menu',
      onClickPreview: _.noop,
      ...props
    };
  };

  let element;

  beforeEach(() => {
    element = renderComponent(EditBar, getProps());
  });

  it('renders', () => {
    expect(element).to.exist;
  });

  it('renders the page name', () => {
    expect(element.innerText).to.contain('wombats');
  });

  it('renders a preview button', () => {
    expect(element.querySelector('.btn-preview')).to.exist;
  });

  it('invokes onClickPreview on preview click', () => {
    const onClickSpy = sinon.spy();
    const element = renderComponent(EditBar, getProps({
      onClickPreview: onClickSpy
    }));

    TestUtils.Simulate.click(element.querySelector('.btn-preview'));

    expect(onClickSpy).to.have.been.called;
  });
});