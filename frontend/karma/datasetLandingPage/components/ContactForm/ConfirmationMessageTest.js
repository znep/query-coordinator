import { expect, assert } from 'chai';
import ConfirmationMessage from 'datasetLandingPage/components/ContactForm/ConfirmationMessage';

describe('components/ContactForm/ConfirmationMessage', function() {
  it('renders an element', function() {
    var element = renderComponent(ConfirmationMessage, {
      success: true,
      text: 'Penguins with Coat Tails'
    });

    assert.ok(element);
  });

  it('displays .success for success messages', function() {
    var element = renderComponent(ConfirmationMessage, {
      success: true,
      text: 'Penguins with Coat Tails'
    });

    assert.ok(element.querySelector('.success'));
    assert.isNull(element.querySelector('.error'));
  });

  it('displays .error for error messages', function() {
    var element = renderComponent(ConfirmationMessage, {
      success: false,
      text: 'Penguins without Coat Tails'
    });

    assert.ok(element.querySelector('.error'));
    assert.isNull(element.querySelector('.success'));
  });
});
