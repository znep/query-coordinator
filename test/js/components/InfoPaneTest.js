import InfoPane from 'components/InfoPane';

describe('InfoPane', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      name: 'A Different View',
      description: 'A description',
      category: 'Fun',
      isOfficial: true,
      isPrivate: true,
      footer: 'Athlete\'s Footer',
      metadata: {
        first: {
          label: 'Updated',
          content: 'Today'
        },
        second: {
          label: 'View count',
          content: 1
        }
      }
    });
  }

  const getName = (element) => element.querySelector('.info-pane-name');
  const getOfficial = (element) => element.querySelector('.tag-official');
  const getPrivateIcon = (element) => element.querySelector('.icon-private');
  const getDescription = (element) => element.querySelector('.entry-description div');
  const getButtons = (element) => element.querySelector('.entry-actions');

  it('renders a name', () => {
    const element = renderComponent(InfoPane, getProps());
    expect(getName(element).textContent).to.equal('A Different View');
  });

  it('renders an official badge when isOfficial is set', () => {
    const element = renderComponent(InfoPane, getProps());
    expect(getOfficial(element)).to.exist;
  });

  it('does not render an official badge when isOfficial is not set', () => {
    const element = renderComponent(InfoPane, getProps({ isOfficial: false }));
    expect(getOfficial(element)).to.not.exist;
  });

  it('renders a lock icon when isPrivate is set', () => {
    const element = renderComponent(InfoPane, getProps());
    expect(getPrivateIcon(element)).to.exist;
  });

  it('does not render a lock icon when isPrivate is not set', () => {
    const element = renderComponent(InfoPane, getProps({ isPrivate: false }));
    expect(getPrivateIcon(element)).to.not.exist;
  });

  it('renders the description', () => {
    const element = renderComponent(InfoPane, getProps());
    expect(getDescription(element).textContent).to.equal('A description');
  });

  it('renders buttons using the specified function', () => {
    const element = renderComponent(InfoPane, getProps({
      renderButtons: () => { return 'button'; }
    }));

    expect(getButtons(element).textContent).to.equal('button');
  });
});
