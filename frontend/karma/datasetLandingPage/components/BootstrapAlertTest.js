import { BootstrapAlert } from 'components/BootstrapAlert';
import mockView from 'data/mockView';

describe('components/BootstrapAlert', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      bootstrapUrl: 'bootstrapUrl'
    });
  }

  it('renders an element', function() {
    var element = renderComponent(BootstrapAlert, getProps());
    expect(element).to.exist;
  });

  it('has a link with the bootstrap url', function() {
    var element = renderComponent(BootstrapAlert, getProps());
    expect(element.querySelector('a')).to.exist;
    expect(element.querySelector('a').getAttribute('href')).to.equal('bootstrapUrl');
    expect(element.querySelector('a').classList.contains('.btn-disabled')).to.equal(false);
  });

  it('disables the link and renders a flyout if the bootrap url is null', function() {
    var element = renderComponent(BootstrapAlert, getProps({
      bootstrapUrl: null
    }));

    expect(element.querySelector('a')).to.exist;
    expect(element.querySelector('.flyout')).to.exist;
    expect(element.querySelector('a').classList.contains('btn-disabled')).to.equal(true);
  });
});

