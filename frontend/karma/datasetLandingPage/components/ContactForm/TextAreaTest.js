import sinon from 'sinon';
import { expect, assert } from 'chai';
import TextArea from 'datasetLandingPage/components/ContactForm/TextArea';

describe('components/ContactForm/TextArea', function() {
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
    var element = renderComponent(TextArea, defaultProps);
    assert.ok(element);
  });

  it('invokes the onChange handler on change', function() {
    var onChangeSpy = sinon.spy();
    var element = renderComponent(TextArea, _.merge(defaultProps, {
      onChange: onChangeSpy
    }));
    var textarea = element.querySelector('textarea');

    textarea.value = 'one small step';
    TestUtils.Simulate.change(textarea);
    sinon.assert.called(onChangeSpy);
  });

  it('sets aria-invalid attribute when visited and invalid', function() {
    var element = renderComponent(TextArea, _.merge(defaultProps, {
      field: { value: '' }
    }));
    var textarea = element.querySelector('textarea');

    TestUtils.Simulate.blur(textarea);
    expect(textarea.getAttribute('aria-invalid')).to.equal('true');
  });
});
