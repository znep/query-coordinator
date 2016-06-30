import React from 'react';
import NavigationControl from 'components/navigationControl';


describe('NavigationControl', () => {
  it('renders with all buttons disabled when passed no attributes', () => {
    const element = renderComponent(NavigationControl({}));
    expect(element.querySelector('a.button.cancelButton.disabled'))
      .to.be.defined;
    expect(element.querySelector('a.button.prevButton.disabled'))
      .to.be.defined;
    expect(element.querySelector('a.button.nextButton.disabled'))
      .to.be.defined;
    expect(element.querySelector('a.button.nextButton').innerText)
      .to.equal('Next');
  });

  it('renders a finish button when a link is passed to finishLink', () => {
    const element = renderComponent(NavigationControl({finishLink: '/hello.txt'}));
    expect(element.querySelector('a.button.nextButton.default'))
      .to.be.defined;
    expect(element.querySelector('a.button.nextButton.default').innerText)
      .to.equal('Finish');
  });

  it('renders all enabled when functions are passed to each attribute', () => {
    const element = renderComponent(NavigationControl({
      onNext: _.noop,
      onPrev: _.noop,
      cancelLink: 'cancel.html'
    }));
    expect(element.querySelector('a.button.cancelButton').className)
      .to.equal('button cancelButton');
    expect(element.querySelector('a.button.nextButton').className)
      .to.equal('button nextButton');
    expect(element.querySelector('a.button.prevButton').className)
      .to.equal('button prevButton');
  })
});
