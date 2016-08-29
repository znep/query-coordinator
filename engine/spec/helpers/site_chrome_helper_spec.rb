require 'rails_helper'

describe SocrataSiteChrome::ApplicationHelper do
  let(:site_chrome_config) do { content: JSON.parse(
    File.read("#{SocrataSiteChrome::Engine.root}/spec/fixtures/site_chrome_config.json")).
    with_indifferent_access['properties'].first.dig('value', 'versions',
      SocrataSiteChrome::SiteChrome::LATEST_VERSION, 'published', 'content') }
  end

  describe'#logo' do
    it 'returns nil if there is not an image src present' do
      allow(helper).to receive(:header_title).and_return('')
      source = {}
      result = helper.logo(source)
      expect(result).to eq(nil)
    end

    it 'returns an image tag with the a src and alt attribute' do
      source = {
        'logo' => {
          'src' => 'http://myimage.png',
          'alt' => 'Goats'
        }
      }
      result = helper.logo(source)
      expect(result).to eq('<img alt="Goats" onerror="this.style.display=&quot;none&quot;" src="http://myimage.png" />')
    end

    it 'falls back to the header_title if there is no source logo alt' do
      allow(helper).to receive(:header_title).and_return('Goldfinger')
      source = {
        'logo' => {
          'src' => 'http://myimage.png'
        }
      }
      result = helper.logo(source)
      expect(result).to eq('<img alt="Goldfinger" onerror="this.style.display=&quot;none&quot;" src="http://myimage.png" />')
    end

    it 'falls back to "Header Logo" if there is no source logo alt or header_title' do
      allow(helper).to receive(:header_title).and_return(nil)
      source = {
        'logo' => {
          'src' => 'http://myimage.png'
        }
      }
      result = helper.logo(source)
      expect(result).to eq('<img alt="Header Logo" onerror="this.style.display=&quot;none&quot;" src="http://myimage.png" />')
    end
  end

  describe '#header_logo' do
    it 'returns only the site title if the header image is not present' do
      site_chrome = SocrataSiteChrome::SiteChrome.new(site_chrome_config)
      RequestStore.store[:site_chrome] = { published: site_chrome }
      allow(helper).to receive(:logo).and_return(nil)
      result = helper.header_logo
      expect(result).to eq('<a class="logo" href="/"><span class="site-name"></span></a>')
    end

    it 'returns both the site title and the header image' do
      site_chrome = SocrataSiteChrome::SiteChrome.new(site_chrome_config)
      RequestStore.store[:site_chrome] = { published: site_chrome }
      result = helper.header_logo
      expect(result).to eq('<a class="logo" href="/"><img alt="Header Logo" onerror="this.style.display=&quot;none&quot;" src="http://i.imgur.com/E8wtc6d.png" /><span class="site-name"></span></a>')
    end
  end

  describe '#request_current_user' do
    it 'returns the contents of RequestStore.store[:current_user]' do
      allow(RequestStore.store).to receive(:has_key?).with(:current_user).and_return(true)
      allow(RequestStore.store).to receive(:[]).with(:current_user).and_return('id' => 'fooo-baar')
      expect(helper.request_current_user).to eq('id' => 'fooo-baar')
    end
  end

  describe '#logged_in' do
    it 'returns true if request_current_user is present' do
      allow(helper).to receive(:request_current_user).and_return('id' => 'fooo-baar')
      expect(helper.logged_in?).to eq(true)
    end

    it 'returns false if request_current_user is not present' do
      allow(helper).to receive(:request_current_user).and_return(nil)
      expect(helper.logged_in?).to eq(false)
    end
  end

  describe 'current_user_can_modify_site_chrome' do
    context 'with an instance of a User object' do
      let(:user) { User.new }

      before do
        allow(helper).to receive(:request_current_user).and_return(user)
      end

      it 'returns true when can_use_site_appearance? is true' do
        allow(user).to receive(:can_use_site_appearance?).and_return(true)
        expect(helper.current_user_can_modify_site_chrome?).to eq(true)
      end

      it 'returns false when can_use_site_appearance? is false' do
        allow(user).to receive(:can_use_site_appearance?).and_return(false)
        expect(helper.current_user_can_modify_site_chrome?).to eq(false)
      end
    end

    context 'with Hash representation of a User object' do
      let(:user) { {'roleName' => roleName } }

      before do
        allow(helper).to receive(:request_current_user).and_return(user)
      end

      context 'as a designer' do
        let(:roleName) { 'designer' }

        it 'returns true when the user has correct privileges' do
          expect(helper.current_user_can_modify_site_chrome?).to eq(true)
        end
      end

      context 'as a viewer' do
        let(:roleName) { 'viewer' }

        it 'returns false' do
          expect(helper.current_user_can_modify_site_chrome?).to eq(false)
        end
      end
    end
  end

  describe '#username' do
    it 'returns "Profile" if there is no request_current_user' do
      allow(RequestStore.store).to receive(:[]).and_return(nil)
      allow(RequestStore.store).to receive(:has_key?).with(:current_user).and_return(true)
      expect(helper.username).to eq('Profile')
    end

    it 'returns "Profile" if there is a request_current_user with no displayName' do
      allow(RequestStore.store).to receive(:[]).and_return('id' => 'fooo-baar')
      allow(RequestStore.store).to receive(:has_key?).with(:current_user).and_return(true)
      expect(helper.username).to eq('Profile')
    end

    it 'returns the request_current_user displayName if there is a request_current_user' do
      allow(RequestStore.store).to receive(:[]).and_return('displayName' => 'derek zoolander')
      allow(RequestStore.store).to receive(:has_key?).with(:current_user).and_return(true)
      expect(helper.username).to eq('derek zoolander')
    end
  end

  describe '#copyright' do
    it 'returns only the copyright and year if there is no site name' do
      allow(helper).to receive(:copyright_source).and_return(nil)
      test_time = Time.parse('Jan 1 1984')
      allow(Time).to receive(:now).and_return(test_time)
      expect(helper.copyright).to eq("&copy; 1984 ")
    end

    it 'returns only the copyright and year if site name is empty' do
      allow(helper).to receive(:copyright_source).and_return("")
      test_time = Time.parse('Jan 1 1984')
      allow(Time).to receive(:now).and_return(test_time)
      expect(helper.copyright).to eq("&copy; 1984 ")
    end

    it 'returns the copyright and year and site name' do
      allow(helper).to receive(:copyright_source).and_return(%Q(Seattle Open Data))
      test_time = Time.parse('Jan 1 1984')
      allow(Time).to receive(:now).and_return(test_time)
      expect(helper.copyright).to eq(%Q(&copy; 1984 Seattle Open Data))
    end
  end

  describe '#show_powered_by?' do
    let(:site_chrome) do
      SocrataSiteChrome::SiteChrome.new(site_chrome_config)
    end

    it 'defaults to true if powered_by does not exist' do
      site_chrome.footer.delete(:powered_by)
      RequestStore.store[:site_chrome] = { published: site_chrome }
      expect(helper.show_powered_by?).to eq(true)
    end

    it 'can be set to true' do
      site_chrome.footer[:powered_by] = 'true'
      RequestStore.store[:site_chrome] = { published: site_chrome }
      expect(helper.show_powered_by?).to eq(true)
    end

    it 'can be set to false' do
      site_chrome.footer[:powered_by] = 'false'
      RequestStore.store[:site_chrome] = { published: site_chrome }
      expect(helper.show_powered_by?).to eq(false)
    end
  end

  describe '#social_link_icon' do
    it 'returns the icon name regardless of symbol vs string and capitalization' do
      result = helper.social_link_icon('FacEboOk')
      result2 = helper.social_link_icon(:facebook)
      expect(result).to eq(result2)
      expect(result).to eq('facebook')
    end

    it 'returns the Mono Social icon name for an icon' do
      expect(helper.social_link_icon('google_plus')).to eq('googleplus')
      expect(helper.social_link_icon('linked_in')).to eq('linkedin')
    end
  end

  describe '#valid_social_links' do
    it 'returns an empty array if passed nil' do
      expect(helper.valid_social_links(nil)).to match_array([])
    end

    it 'returns an empty array if passed an empty hash' do
      expect(helper.valid_social_links({})).to match_array([])
    end

    describe 'version <= 0.2' do
      it 'returns only links with a url present' do
        test_links = [
          { 'type': 'facebook', 'url': 'http://facebook.com/bobsaget' },
          { 'type': 'twitter', 'url': '' }
        ]

        allow(helper).to receive(:current_version_is_greater_than_or_equal?).and_return(false)

        result = helper.valid_social_links(test_links)
        expect(result).to match_array([ type: 'facebook', url: 'http://facebook.com/bobsaget' ])
      end
    end

    describe 'version 0.3' do
      it 'returns only links with a url present' do
        test_links = {
          'facebook': { 'url': 'http://facebook.com/bobsaget' },
          'twitter': { 'url': '' }
        }

        allow(helper).to receive(:current_version_is_greater_than_or_equal?).and_return(true)

        result = helper.valid_social_links(test_links)
        expect(result).to match_array([{ 'type': 'facebook', 'url': 'http://facebook.com/bobsaget' }])
      end
    end
  end

  describe '#navbar_links_div' do
    it 'returns a div with the classname "site-chrome-nav-links"' do
      site_chrome = SocrataSiteChrome::SiteChrome.new(site_chrome_config)
      RequestStore.store[:site_chrome] = { :published => site_chrome }
      result = Nokogiri::HTML.parse(helper.navbar_links_div)
      expect(result.search('div.site-chrome-nav-links').length).to eq(1)
    end

    it 'creates a site-chrome-nav-menu for nested links' do
      site_chrome = SocrataSiteChrome::SiteChrome.new(site_chrome_config)
      site_chrome.content['header']['links'].push(
        { :key => 'menu_0', :links => [{ :key => 'menu_0_link_0', :url => 'http://opendata.gov' }] }
      )
      RequestStore.store[:site_chrome] = { :published => site_chrome }
      result = Nokogiri::HTML.parse(helper.navbar_links_div)
      expect(result.search('div.site-chrome-nav-menu').length).to eq(1)
      expect(result.search('div.site-chrome-nav-menu div.dropdown').length).to eq(1)
      expect(result.search('a.site-chrome-nav-child-link').length).to eq(1)
      expect(result.search('a.site-chrome-nav-child-link').attr('href').value).to eq('http://opendata.gov')
    end

    it 'creates top level links' do
      site_chrome = SocrataSiteChrome::SiteChrome.new(site_chrome_config)
      site_chrome.content['header']['links'] = [
        { :key => 'link_0', :url => 'http://a.gov' },
        { :key => 'link_1', :url => 'http://b.gov' },
        { :key => 'link_2', :url => 'http://c.gov' }
      ]
      RequestStore.store[:site_chrome] = { :published => site_chrome }
      result = Nokogiri::HTML.parse(helper.navbar_links_div)
      expect(result.search('.site-chrome-nav-link').length).to eq(3)
    end

    it 'returns nav-menu-title instead of nested dropdown links if use_dropdown is false' do
      site_chrome = SocrataSiteChrome::SiteChrome.new(site_chrome_config)
      site_chrome.content['header']['links'].push(
        { :key => 'menu_0', :links => [{ :key => 'menu_0_link_0', :url => 'http://opendata.gov' }] }
      )
      RequestStore.store[:site_chrome] = { :published => site_chrome }
      result = Nokogiri::HTML.parse(helper.navbar_links_div(use_dropdown: false))
      expect(result.search('div.site-chrome-nav-menu div.dropdown').length).to eq(0)
      expect(result.search('.site-chrome-nav-menu').length).to eq(1)
      expect(result.search('.nav-menu-title').length).to eq(1)
    end
  end

  describe '#navbar_child_links_array' do
    it 'returns an array of link tags for the valid link items' do
      links = [
        { :key => 'link_0', :url => '/a' },
        { :key => '', :url => '/z' }, # invalid, should be excluded from result
        { :key => 'link_1', :url => '/b' },
        { :key => 'link_2', :url => '/c' }
      ]
      result = Nokogiri::HTML.parse(helper.navbar_child_links_array(links).join(''))
      nav_links = result.search('a.site-chrome-nav-child-link')
      expect(nav_links.length).to eq(3)
      expect(nav_links.first.get_attribute('href')).to eq('/a')
      expect(nav_links.last.get_attribute('href')).to eq('/c')
    end
  end

  describe '#valid_navbar_menu_item?' do
    let(:valid_menu_item) do
      {
        :key => 'menu_0',
        :links => [{
          :key => 'menu_0_link_0',
          :url => 'http://oooopppennndaaattaaa'
        }]
      }
    end

    it 'is false for items without a key present' do
      test_item = valid_menu_item.tap { |item| item[:key] = '' }
      expect(helper.valid_navbar_menu_item?(test_item)).to eq(false)
    end

    it 'is false for items without links present' do
      test_item = valid_menu_item.tap { |item| item[:links] = nil }
      expect(helper.valid_navbar_menu_item?(test_item)).to eq(false)
    end

    it 'is false for items without a valid link present inside links' do
      test_item = valid_menu_item
      test_item[:links][0][:url] = ''
      expect(helper.valid_navbar_menu_item?(test_item)).to eq(false)
    end

    it 'is true for items with a key, links, and a valid link' do
      expect(helper.valid_navbar_menu_item?(valid_menu_item)).to eq(true)
    end
  end

  describe '#valid_link_item?' do
    it 'is false for links without a key present' do
      link = { 'key': '', 'url': 'http://facebook.com' }
      expect(helper.valid_link_item?(link)).to eq(false)
    end

    it 'is false for links without a url present' do
      link = { 'key': 'test', 'url': '' }
      expect(helper.valid_link_item?(link)).to eq(false)
    end

    it 'is true for links with both a key and url present' do
      link = { 'key': 'link_0', 'url': 'http://google.com' }
      expect(helper.valid_link_item?(link)).to eq(true)
    end
  end

  describe '#url_with_prefix' do
    it 'does not modify a url that starts with http://' do
      url = 'http://google.com'
      expect(helper.url_with_prefix(url)).to eq('http://google.com')
    end

    it 'does not modify a url that starts with https://' do
      url = 'https://google.com'
      expect(helper.url_with_prefix(url)).to eq('https://google.com')
    end

    it 'does not modify a url that starts with /' do
      url = '/browse'
      expect(helper.url_with_prefix(url)).to eq('/browse')
    end

    it 'prepends http:// to a url that does not have a scheme or leading slash' do
      url = 'facebook.com/bananas'
      expect(helper.url_with_prefix(url)).to eq('http://facebook.com/bananas')

      url2 = 'www.test.com/asdf'
      expect(helper.url_with_prefix(url2)).to eq('http://www.test.com/asdf')
    end
  end

  describe '#localized' do
    it 'returns nil if it cannot find the locale_key in the locales hash' do
      locales = {
        'en' => {
          'random_key' => 'random_value'
        }
      }
      locale_key = 'blah.blah.blah'

      result = helper.localized(locale_key, locales)
      expect(result).to eq(nil)
    end

    it 'returns the correct localized string' do
      locales = {
        'en' => {
          'bruce' => {
            'lee' => {
              'is' => 'pretty neat'
            }
          }
        }
      }
      locale_key = 'bruce.lee.is'

      result = helper.localized(locale_key, locales)
      expect(result).to eq('pretty neat')
    end

    # TODO - tests for different locales
  end

  describe '#current_template' do
    it 'returns "default" by default' do
      expect(helper.current_template).to eq('default')
    end

    it 'returns "default" if an invalid string is set in the url param' do
      helper.request.query_parameters[:site_chrome_template] = 'asdf'
      expect(helper.current_template).to eq('default')
    end

    it 'returns "rally" if it is set in the url param, regardless of type' do
      helper.request.query_parameters[:site_chrome_template] = 'RaLLy'
      expect(helper.current_template).to eq('rally')
    end
  end

  describe '#current_version_is_greater_than_or_equal?' do
    it 'returns false if the current version is less than the version passed' do
      allow_any_instance_of(SocrataSiteChrome::SiteChrome).to receive(:current_version).and_return('0.1')
      expect(helper.current_version_is_greater_than_or_equal?('0.2')).to eq(false)
    end

    it 'returns true if the current version is the same as the version passed' do
      allow_any_instance_of(SocrataSiteChrome::SiteChrome).to receive(:current_version).and_return('0.2')
      expect(helper.current_version_is_greater_than_or_equal?('0.2')).to eq(true)
    end

    it 'returns true if the current version is greater than the version passed' do
      allow_any_instance_of(SocrataSiteChrome::SiteChrome).to receive(:current_version).and_return('0.3')
      expect(helper.current_version_is_greater_than_or_equal?('0.2')).to eq(true)
    end
  end
end
