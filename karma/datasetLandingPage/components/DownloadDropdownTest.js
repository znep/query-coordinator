import DownloadDropdown from 'components/DownloadDropdown';
import mockView from 'data/mockView';

describe('components/DownloadDropdown', function() {
  it('renders an element', function() {
    var element = renderComponent(DownloadDropdown, {
      view: mockView
    });

    expect(element).to.exist;
  });

  it('renders all the options', function(){
    var element = renderComponent(DownloadDropdown, {
      view: mockView
    });

    expect(element.querySelectorAll('a').length).to.equal(mockView.exportFormats.length);
  });

  it('renders CSV for Excel Option', function(){
    var element = renderComponent(DownloadDropdown, {
      view: mockView
    });

    var downloadOption = element.querySelector('[data-type="CSV for Excel"]');
    expect(downloadOption).to.exist;
    expect(downloadOption.getAttribute('href')).to.contain('.csv');
    expect(downloadOption.getAttribute('href')).to.contain('bom');
  });

  it('renders TSV for Excel Option', function(){
    var element = renderComponent(DownloadDropdown, {
      view: mockView
    });

    var downloadOption = element.querySelector('[data-type="TSV for Excel"]');
    expect(downloadOption).to.exist;
    expect(downloadOption.getAttribute('href')).to.contain('.tsv');
    expect(downloadOption.getAttribute('href')).to.contain('bom');
  });

  it('uses an overrideLink value if it is set', function() {
    var link = 'http://somelink';
    var element = renderComponent(DownloadDropdown, {
      view: _.extend({}, mockView, { metadata: { overrideLink: link } })
    });
    expect(element.href).to.contain(link);
  });

  it('uses a blob download if the view is blobby', function() {
    var link = 'someLink';
    var element = renderComponent(DownloadDropdown, {
      view: _.extend({}, mockView, { isBlobby: true })
    });
    expect(element.href).to.match(/file_data/);
  });
});
