import $ from 'jquery';
import _ from 'lodash';
import { Simulate } from 'react-dom/test-utils';
import { FlannelHeader } from 'components/Flannel';
import { renderPureComponent } from '../../helpers';

const getTitle = (element) => element.querySelector('.socrata-flannel-header-title');
const getButton = (element) => element.querySelector('.socrata-flannel-header-dismiss');

describe('FlannelHeader', () => {
  let element;
  let title = 'Hello, World!';
  let onDismissSpy;
  const getProps = (props) => {
    return _.defaultsDeep({}, props);
  };

  beforeEach(() => {
    onDismissSpy = sinon.spy();
    element = renderPureComponent(FlannelHeader(getProps({ // eslint-disable-line new-cap
      title,
      onDismiss: onDismissSpy
    })));
  });

  it('renders', () => {
    assert.isNotNull(element);
    assert.isTrue($(element).hasClass('socrata-flannel-header'));
  });

  it('renders a title', () => {
    assert.isNotNull(getTitle(element));
    assert.include($(getTitle(element)).text(), title);
  });

  it('renders a close button', () => {
    assert.isNotNull(getButton(element));
  });

  it('calls onDismiss when close is clicked', () => {
    Simulate.click(getButton(element));
    assert.equal(onDismissSpy.called, true);
  });
});
