import ConfirmationMessage from 'components/ContactForm/ConfirmationMessage';

describe('components/ContactForm/ConfirmationMessage', function() {
  it('renders an element', function() {
    var element = renderPureComponent(ConfirmationMessage({
      success: true,
      text: 'Penguins with Coat Tails'
    }));

    expect(element).to.exist;
  });

  it('displays .success for success messages', function() {
    var element = renderPureComponent(ConfirmationMessage({
      success: true,
      text: 'Penguins with Coat Tails'
    }));

    expect(element.querySelector('.success')).to.exist;
    expect(element.querySelector('.error')).to.not.exist;
  });

  it('displays .error for error messages', function() {
    var element = renderPureComponent(ConfirmationMessage({
      success: false,
      text: 'Penguins without Coat Tails'
    }));

    expect(element.querySelector('.error')).to.exist;
    expect(element.querySelector('.success')).to.not.exist;
  });
});
