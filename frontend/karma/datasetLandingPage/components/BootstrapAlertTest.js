import { expect, assert } from 'chai';
import { BootstrapAlert } from 'datasetLandingPage/components/BootstrapAlert';
import mockView from '../data/mockView';

describe('components/BootstrapAlert', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      bootstrapUrl: 'bootstrapUrl'
    });
  }

  it('renders an element', function() {
    var element = renderComponent(BootstrapAlert, getProps());
    assert.ok(element);
  });

  it('has a link with the bootstrap url', function() {
    var element = renderComponent(BootstrapAlert, getProps());
    assert.ok(element.querySelector('a'));
    expect(element.querySelector('a').getAttribute('href')).to.equal('bootstrapUrl');
    expect(element.querySelector('a').classList.contains('.btn-disabled')).to.equal(false);
  });

  it('disables the link and renders a flyout if the bootrap url is null', function() {
    var element = renderComponent(BootstrapAlert, getProps({
      bootstrapUrl: null
    }));

    assert.ok(element.querySelector('a'));
    assert.ok(element.querySelector('.flyout'));
    expect(element.querySelector('a').classList.contains('btn-disabled')).to.equal(true);
  });
});

