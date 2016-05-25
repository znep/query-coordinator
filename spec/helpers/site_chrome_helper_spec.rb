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
end
