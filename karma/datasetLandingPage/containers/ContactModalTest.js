import ContactModal from 'containers/ContactModal';
import { getDefaultStore } from 'testStore';

describe('containers/ContactModal', function() {
  var state;
  var output;

  beforeEach(function() {
    var store = getDefaultStore();

    var renderer = TestUtils.createRenderer();
    renderer.render(<ContactModal store={store}/>);

    state = store.getState();
    output = renderer.getRenderOutput();
  });

  it('sets fields prop', function() {
    expect(output.props.fields).to.deep.equal(state.contactForm.fields);
  });

  it('sets errors prop', function() {
    expect(output.props.errors).to.deep.equal(state.contactForm.errors);
  });

  it('sets recaptchaLoaded prop', function() {
    expect(output.props.recaptchaLoaded).to.equal(state.contactForm.recaptchaLoaded);
  });

  it('sets status prop', function() {
    expect(output.props.status).to.equal(state.contactForm.status);
  });
});
