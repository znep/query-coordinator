import _ from 'lodash';
import { Simulate } from 'react-addons-test-utils';
import { FlannelHeader } from 'components/Flannel';
import { renderPureComponent } from '../../helpers';

describe('FlannelHeader', () => {
  let element;
  let title = 'Hello, World!';
  let onDismissSpy;

  const getTitle = (element) => element.querySelector('.socrata-flannel-header-title');
  const getButton = (element) => element.querySelector('.socrata-flannel-header-dismiss');
  const getProps = (props) => {
    return _.defaultsDeep({}, props);
  };

  beforeEach(() => {
    onDismissSpy = sinon.spy();
    element = renderPureComponent(FlannelHeader(getProps({
      title,
      onDismiss: onDismissSpy
    })));
  });

  it('renders', () => {
    expect(element).to.exist;
    expect(element).to.have.class('socrata-flannel-header');
  });

  it('renders a title', () => {
    expect(getTitle(element)).to.exist;
    expect(getTitle(element)).to.have.text(title);
  });

  it('renders a close button', () => {
    expect(getButton(element)).to.exist;
  });

  it('calls onDismiss when close is clicked', () => {
    Simulate.click(getButton(element));
    expect(onDismissSpy.called).to.equal(true);
  });
});
