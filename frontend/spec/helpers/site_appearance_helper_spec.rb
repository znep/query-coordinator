# Encoding: utf-8
require 'rails_helper'

describe SiteAppearanceHelper do
  let(:site_chrome) do
    json = JSON.parse(File.read('spec/fixtures/site_chrome.json'))
    sc = SiteAppearance.new(json) # properties will get ignored an initialization
    sc.properties = json['properties'] # have to add then separately
    sc
  end

  let(:dummy_class) do
    Class.new do
      attr_accessor :output_buffer
      include ApplicationHelper
      include SiteAppearanceHelper
      include ActionView::Helpers
    end
  end

  let(:subject) { dummy_class.new }

  describe '#social_share_link' do
    before(:each) do
      allow(subject).to receive(:site_chrome_published_mode?).and_return(true)
    end

    it 'should return nil if social shares do not exist' do
      expect(subject.social_share_link('myspace', site_chrome)).to be_nil
    end

    it 'should return the url of the given social share' do
      expect(subject.social_share_link('facebook', site_chrome)).to eq('http://facebook.com')
      expect(subject.social_share_link('twitter', site_chrome)).to eq('http://twitter.com')
    end
  end

  describe 'fetch_content' do
    before(:each) do
      allow(subject).to receive(:site_chrome_published_mode?).and_return(true)
    end

    it 'should not raise on empty content' do
      path = [:here, :there, :everywhere]
      expect { subject.fetch_content(path, site_chrome) }.not_to raise_error
      expect(subject.fetch_content(path, site_chrome)).to be_nil
    end

    it 'should find something one deep' do
      site_chrome.content['pants'] = 'bloomers'
      path = [:pants]
      assert_equal 'bloomers', subject.fetch_content(path, site_chrome)
    end

    it 'should be able to find things are depth three' do
      site_chrome.content['here'] = { 'there' => { 'everywhere' => { 'key' => 'value' } } }
      path = [:here, :there, :everywhere]
      expect(subject.fetch_content(path, site_chrome)).to eq('key' => 'value')
    end

    it 'should be nil and not raise if nothing is found at depth three' do
      site_chrome.content['here'] = { 'there' => { 'somewhere' => { 'some_key' => 'some_value' } } }
      path = [:here, :there, :everywhere]
      expect { subject.fetch_content(path, site_chrome) }.not_to raise_error
      expect(subject.fetch_content(path, site_chrome)).to be_nil
    end

    it 'should be nil and not raise if nothing is found at depth four' do
      site_chrome.content['here'] = { 'there' => { 'somewhere' => { 'some_key' => 'some_value' } } }
      path = [:here, :there, :everywhere, :nowhere]
      expect { subject.fetch_content(path, site_chrome) }.not_to raise_error
      expect(subject.fetch_content(path, site_chrome)).to be_nil
    end

    it 'should not throw when colliding with arrays' do
      site_chrome.content['here'] = ["array", "of", "strings"]
      path = [:here, :there, :everywhere, :nowhere]
      expect { subject.fetch_content(path, site_chrome) }.not_to raise_error
      expect(subject.fetch_content(path, site_chrome)).to be_nil
    end

    it 'should not throw when colliding with a string' do
      site_chrome.content['here'] = "i am a length stringvalue"
      path = [:here, :there, :everywhere, :nowhere]
      expect { subject.fetch_content(path, site_chrome) }.not_to raise_error
      expect(subject.fetch_content(path, site_chrome)).to be_nil
    end
  end

  describe '#fetch_boolean' do
    before(:each) do
      allow(subject).to receive(:site_chrome_published_mode?).and_return(true)
    end

    it 'returns false if the content is nil' do
      allow(subject).to receive(:fetch_content).and_return(nil)
      expect(subject.fetch_boolean([])).to eq(false)
    end

    it 'returns false if the whitelist is not met' do
      allow(subject).to receive(:fetch_content).and_return('whatever')
      expect(subject.fetch_boolean([])).to eq(false)
    end

    ['1', 'true', 1, true].each do |test|
      it "returns true if content is `#{test}`" do
        allow(subject).to receive(:fetch_content).and_return(test)
        expect(subject.fetch_boolean([])).to eq(true)
      end
    end

    describe 'with true default value' do
      it 'returns true if the content is nil' do
        allow(subject).to receive(:fetch_content).and_return(nil)
        expect(subject.fetch_boolean([], true)).to eq(true)
      end

      it 'returns false if the whitelist is not met' do
        allow(subject).to receive(:fetch_content).and_return('whatever')
        expect(subject.fetch_boolean([], true)).to eq(false)
      end

      ['1', 'true', 1, true].each do |test|
        it "returns true if content is `#{test}`" do
          allow(subject).to receive(:fetch_content).and_return(test)
          expect(subject.fetch_boolean([], true)).to eq(true)
        end
      end
    end
  end

  describe '#link_row_div' do
    before(:each) do
      allow(subject).to receive(:fetch_content).and_return('some content')
    end

    it 'returns three input tags' do
      options = {
        :content_key => 'footer',
        :placeholder => {},
        :default => false,
        :child_link => false
      }
      result = Nokogiri::HTML.parse(subject.link_row_div(nil, options))
      expect(result.search('input').length).to eq(3)
    end

    it 'returns a default link row' do
      options = {
        :content_key => 'footer',
        :placeholder => {},
        :default => true,
        :child_link => false
      }
      result = Nokogiri::HTML.parse(subject.link_row_div(nil, options))
      expect(result.search('.link-row.default').length).to eq(1)
    end

    it 'returns a child link row' do
      options = {
        :content_key => 'footer',
        :placeholder => {},
        :default => false,
        :child_link => true
      }
      result = Nokogiri::HTML.parse(subject.link_row_div(nil, options))
      expect(result.search('.link-row.child').length).to eq(1)
    end

    it 'returns a default child link row' do
      options = {
        :content_key => 'header',
        :placeholder => {},
        :default => true,
        :child_link => true
      }
      result = Nokogiri::HTML.parse(subject.link_row_div(nil, options))
      expect(result.search('.link-row.default.child').length).to eq(1)
    end

    it 'returns an icon for dragging the fields, and an icon for removing the fields' do
      link = {
        'key' => 'google', 'url' => 'http://google.com'
      }
      options = {
        :content_key => 'header',
        :placeholder => {},
        :default => false,
        :child_link => true
      }
      result = Nokogiri::HTML.parse(subject.link_row_div(link, options))
      expect(result.search('.move-link-row').length).to eq(1)
      expect(result.search('.remove-link-row').length).to eq(1)
    end
  end

  describe '#link_menu_div' do
    before(:each) do
      allow(subject).to receive(:fetch_content).and_return('some content')
    end

    it 'returns two input tags' do
      options = {
        :content_key => 'header',
        :placeholder => {}
      }
      result = Nokogiri::HTML.parse(subject.link_menu_div(nil, options))
      expect(result.search('input').length).to eq(2)
    end

    it 'returns an icon for removing the fields' do
      link = {
        'key' => 'google', 'url' => 'http://google.com'
      }
      options = {
        :content_key => 'header',
        :placeholder => {},
        :default => true
      }
      result = Nokogiri::HTML.parse(subject.link_menu_div(link, options))
      expect(result.search('.remove-link-menu').length).to eq(1)
    end
  end

  describe '#child_link_row_divs' do
    it 'returns child link divs for all present child links' do
      links = [
        { 'key' => 'a', 'url' => '#a' },
        { 'key' => 'b', 'url' => '#b' },
        { 'key' => 'c', 'url' => '#c' },
        { 'key' => 'd', 'url' => '#d' },
      ]
      allow(subject).to receive(:fetch_content).and_return('some content')
      options = {
        :content_key => 'footer',
        :placeholder => {}
      }
      result = Nokogiri::HTML.parse(subject.child_link_row_divs(links, options))
      expect(result.search('input[name="content[footer]links[]links[][url]"]').length).to eq(4)
    end
  end

  describe '#empty_link_row_divs' do
    before(:each) do
      allow(subject).to receive(:fetch_content).and_return('some content')
    end

    it 'returns 3 empty link rows if there are no present links' do
      options = {
        :content_key => 'header',
        :placeholder => {},
        :count => 0
      }
      result = Nokogiri::HTML.parse(subject.empty_link_row_divs(options))
      expect(result.search('.link-row').length).to eq(3)
    end

    it 'returns 2 empty link rows if there is 1 present link' do
      options = {
        :content_key => 'footer',
        :placeholder => {},
        :count => 1
      }
      result = Nokogiri::HTML.parse(subject.empty_link_row_divs(options))
      expect(result.search('.link-row').length).to eq(2)
    end

    it 'returns 0 empty link rows if there are 3 present links' do
      options = {
        :content_key => 'header',
        :placeholder => {},
        :count => 3
      }
      result = Nokogiri::HTML.parse(subject.empty_link_row_divs(options))
      expect(result.search('.link-row').length).to eq(0)
    end

    it 'does not throw an exception if there are > 3 present links' do
      options = {
        :content_key => 'footer',
        :placeholder => {},
        :count => 9
      }
      result = Nokogiri::HTML.parse(subject.empty_link_row_divs(options))
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
      result = subject.present_links(links)
      expect(result).to match_array([])
    end

    it 'returns an array of only links that have a "url" present' do
      links = [
        { 'url' => 'http://facebook.com', 'key' => 'link_0'},
        { 'url' => '', 'key' => 'link_1'},
        { 'url' => '/browse', 'key' => 'link_2'}
      ]
      result = subject.present_links(links)
      expect(result).to match_array(
        [{ 'url' => 'http://facebook.com', 'key' => 'link_0'}, { 'url' => '/browse', 'key' => 'link_2'}]
      )
    end
  end

  describe '#dropdown_option_tags' do
    it 'returns an empty string for an empty array of options' do
      result = subject.dropdown_option_tags([])
      expect(result).to eq('')
    end

    it 'returns option tags for the provided options' do
      wu_tang_clan = subject.dropdown_option_tags(%w(rza gza method_man inspectah_deck odb))
      result = Nokogiri::HTML.parse(wu_tang_clan)
      expect(result.search('a').length).to eq(5)
      rza = result.search('a').first
      expect(rza.text).to eq('rza')
      expect(rza.attribute('href').value).to eq('#')
      expect(rza.attribute('class').value).to eq('dropdown-option')
    end
  end

  describe 'site_appearance_on_entire_site_or_default_state' do
    it 'should be false when activated but not on for the entire site' do
      site_chrome_double = double(SiteAppearance)
      expect(site_chrome_double).to receive(:activated?).and_return(true)
      expect(site_chrome_double).to receive(:on_entire_site?).and_return(false)
      expect(subject.site_appearance_on_entire_site_or_default_state(site_chrome_double)).to eq(false)
    end

    it 'should be true when site chrome has not been activated' do
      site_chrome_double = double(SiteAppearance)
      expect(site_chrome_double).to receive(:activated?).and_return(false)
      expect(subject.site_appearance_on_entire_site_or_default_state(site_chrome_double)).to eq(true)
    end

    it 'should be true when site chrome has on for the entire site' do
      site_chrome_double = double(SiteAppearance)
      expect(site_chrome_double).to receive(:activated?).and_return(true)
      expect(site_chrome_double).to receive(:on_entire_site?).and_return(true)
      expect(subject.site_appearance_on_entire_site_or_default_state(site_chrome_double)).to eq(true)
    end
  end

  describe '#using_non_default_locale?' do
    it 'returns false if there is no default locale set' do
      allow(CurrentDomain).to receive(:configuration).with(:locales).and_return(nil)
      expect(subject.using_non_default_locale?).to eq(false)
    end

    it 'returns false if the default locale equals the current locale' do
      allow(CurrentDomain).to receive(:configuration).with(:locales).and_return(
        OpenStruct.new(:properties => OpenStruct.new(:* => :en))
      )
      allow(I18n).to receive(:locale).and_return(:en)
      expect(subject.using_non_default_locale?).to eq(false)
    end

    it 'returns true if the default locale does not equal the current locale' do
      allow(CurrentDomain).to receive(:configuration).with(:locales).and_return(
        OpenStruct.new(:properties => OpenStruct.new(:* => :en))
      )
      allow(I18n).to receive(:locale).and_return(:es)
      expect(subject.using_non_default_locale?).to eq(true)
    end
  end
end
