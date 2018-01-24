import sinon from 'sinon';
import { expect, assert } from 'chai';
import TextInput from 'datasetLandingPage/components/ContactForm/TextInput';

describe('components/ContactForm/TextInput', function() {
  var defaultProps;

  beforeEach(function() {
    defaultProps = {
      field: {
        value: 'in space',
        invalid: true
      },
      label: 'magical',
      name: 'wombats',
      onChange: _.noop
    };
  });

  it('renders an element', function() {
    var element = renderComponent(TextInput, defaultProps);
    assert.ok(element);
  });

  it('renders a description when provided', function() {
    var element = renderComponent(TextInput, _.merge(defaultProps, {
      description: 'floating'
    }));
    var description = element.querySelector('#description');

    assert.ok(description);
    expect(description.innerHTML).to.equal('floating');
  });

  it('invokes the onChange handler on change', function() {
    var onChangeSpy = sinon.spy();
    var element = renderComponent(TextInput, _.merge(defaultProps, {
      onChange: onChangeSpy
    }));
    var input = element.querySelector('input');

    input.value = 'one small step';
    TestUtils.Simulate.change(input);
    sinon.assert.called(onChangeSpy);
  });

  it('sets aria-invalid attribute when visited and invalid', function() {
    var element = renderComponent(TextInput, _.merge(defaultProps, {
      field: { value: '' }
    }));
    var input = element.querySelector('input');

    TestUtils.Simulate.blur(input);
    expect(input.getAttribute('aria-invalid')).to.equal('true');
  });
});
