# Encoding: utf-8
require 'rails_helper'

describe SiteChromeHelper do
  let(:site_chrome) do
    json = JSON.parse(File.read('spec/fixtures/site_chrome.json'))
    sc = SiteChrome.new(json) # properties will get ignored an initialization
    sc.properties = json['properties'] # have to add then separately
    sc
  end

  describe '#social_share_link' do
    it 'should return nil if social shares do not exist' do
      expect(social_share_link('myspace', site_chrome)).to be_nil
    end

    it 'should return the url of the given social share' do
      expect(social_share_link('facebook', site_chrome)).to eq('http://facebook.com')
      expect(social_share_link('twitter', site_chrome)).to eq('http://twitter.com')
    end
  end

  describe 'fetch_content' do
    # I know, this is all silly when we'll have `dig` after 2.3

    it 'should not raise on empty content' do
      path = [:here, :there, :everywhere]
      expect { fetch_content(path, site_chrome) }.not_to raise_error
      expect(fetch_content(path, site_chrome)).to be_nil
    end

    it 'should find something one deep' do
      site_chrome.content['pants'] = 'bloomers'
      path = [:pants]
      assert_equal 'bloomers', fetch_content(path, site_chrome)
    end

    it 'should be able to find things are depth three' do
      site_chrome.content['here'] = { 'there' => { 'everywhere' => { 'key' => 'value' } } }
      path = [:here, :there, :everywhere]
      expect(fetch_content(path, site_chrome)).to eq('key' => 'value')
    end

    it 'should be nil and not raise if nothing is found at depth three' do
      site_chrome.content['here'] = { 'there' => { 'somewhere' => { 'some_key' => 'some_value' } } }
      path = [:here, :there, :everywhere]
      expect { fetch_content(path, site_chrome) }.not_to raise_error
      expect(fetch_content(path, site_chrome)).to be_nil
    end

    it 'should be nil and not raise if nothing is found at depth four' do
      site_chrome.content['here'] = { 'there' => { 'somewhere' => { 'some_key' => 'some_value' } } }
      path = [:here, :there, :everywhere, :nowhere]
      expect { fetch_content(path, site_chrome) }.not_to raise_error
      expect(fetch_content(path, site_chrome)).to be_nil
    end

    it 'should not throw when colliding with arrays' do
      site_chrome.content['here'] = ["array", "of", "strings"]
      path = [:here, :there, :everywhere, :nowhere]
      expect { fetch_content(path, site_chrome) }.not_to raise_error
      expect(fetch_content(path, site_chrome)).to be_nil
    end

    it 'should not throw when colliding with a string' do
      site_chrome.content['here'] = "i am a length stringvalue"
      path = [:here, :there, :everywhere, :nowhere]
      expect { fetch_content(path, site_chrome) }.not_to raise_error
      expect(fetch_content(path, site_chrome)).to be_nil
    end
  end

  describe '#fetch_boolean' do
    it 'returns false if the content is nil' do
      allow(self).to receive(:fetch_content).and_return(nil)
      expect(fetch_boolean([])).to eq(false)
    end

    it 'returns false if the whitelist is not met' do
      allow(self).to receive(:fetch_content).and_return('whatever')
      expect(fetch_boolean([])).to eq(false)
    end

    ['1', 'true', 1, true].each do |test|
      it "returns true if content is `#{test}`" do
        allow(self).to receive(:fetch_content).and_return(test)
        expect(fetch_boolean([])).to eq(true)
      end
    end

    describe 'with true default value' do
      it 'returns true if the content is nil' do
        allow(self).to receive(:fetch_content).and_return(nil)
        expect(fetch_boolean([], true)).to eq(true)
      end

      it 'returns false if the whitelist is not met' do
        allow(self).to receive(:fetch_content).and_return('whatever')
        expect(fetch_boolean([], true)).to eq(false)
      end

      ['1', 'true', 1, true].each do |test|
        it "returns true if content is `#{test}`" do
          allow(self).to receive(:fetch_content).and_return(test)
          expect(fetch_boolean([], true)).to eq(true)
        end
      end
    end
  end

  describe '#link_row_div' do
    it 'returns three input tags' do
      allow(self).to receive(:fetch_content).and_return('some content')
      result = Nokogiri::HTML.parse(link_row_div('footer', nil, {}, false))
      expect(result.search('input').length).to eq(3)
    end

    it 'returns a default link row' do
      result = Nokogiri::HTML.parse(link_row_div('header', nil, {}, true))
      expect(result.search('.link-row.default').length).to eq(1)
    end
  end

  describe '#empty_link_row_divs' do
    before(:each) do
      allow(self).to receive(:fetch_content).and_return('some content')
    end

    it 'returns 3 empty link rows if there are no present links' do
      result = Nokogiri::HTML.parse(empty_link_row_divs('header', {}, 0))
      expect(result.search('.link-row').length).to eq(3)
    end

    it 'returns 2 empty link rows if there is 1 present link' do
      result = Nokogiri::HTML.parse(empty_link_row_divs('footer', {}, 1))
      expect(result.search('.link-row').length).to eq(2)
    end

    it 'returns 0 empty link rows if there are 3 present links' do
      result = Nokogiri::HTML.parse(empty_link_row_divs('header', {}, 3))
      expect(result.search('.link-row').length).to eq(0)
    end

    it 'does not throw an exception if there are > 3 present links' do
      result = Nokogiri::HTML.parse(empty_link_row_divs('footer', {}, 9))
      expect(result.search('.link-row').length).to eq(0)
    end
  end

  describe '#present_links' do
    it 'returns an empty array if no links have a "url" present' do
      links = [
        { 'url' => '', 'key' => 'link_0'},
        { 'url' => nil, 'key' => 'link_1'},
        { 'key' => 'link_2'}
      ]
      result = present_links(links)
      expect(result).to match_array([])
    end

    it 'returns an array of only links that have a "url" present' do
      links = [
        { 'url' => 'http://facebook.com', 'key' => 'link_0'},
        { 'url' => '', 'key' => 'link_1'},
        { 'url' => '/browse', 'key' => 'link_2'}
      ]
      result = present_links(links)
      expect(result).to match_array(
        [{ 'url' => 'http://facebook.com', 'key' => 'link_0'}, { 'url' => '/browse', 'key' => 'link_2'}]
      )
    end
  end

  describe '#page_controls' do
    it 'returns a page controls div with a save, preview, and cancel button' do
      result = Nokogiri::HTML.parse(page_controls)
      expect(result.search('.page-controls').length).to eq(1)
      expect(result.search('button').length).to eq(3)
      expect(result.search('#site_chrome_save').length).to eq(1)
      expect(result.search('#site_chrome_cancel').length).to eq(1)
      expect(result.search('#site_chrome_preview').length).to eq(1)
    end
  end
end
