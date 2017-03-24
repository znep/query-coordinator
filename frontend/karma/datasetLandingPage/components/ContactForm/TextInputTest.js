import TextInput from 'components/ContactForm/TextInput';

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
    expect(element).to.exist;
  });

  it('renders a description when provided', function() {
    var element = renderComponent(TextInput, _.merge(defaultProps, {
      description: 'floating'
    }));
    var description = element.querySelector('#description');

    expect(description).to.exist;
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
    expect(onChangeSpy).to.have.been.called;
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
