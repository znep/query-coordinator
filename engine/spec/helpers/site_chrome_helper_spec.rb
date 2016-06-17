require 'rails_helper'

describe SocrataSiteChrome::ApplicationHelper do
  let(:site_chrome_config_vars) { JSON.parse(File.read('spec/fixtures/site_chrome_config_vars.json')).with_indifferent_access }
  let(:site_chrome_config) do { content: site_chrome_config_vars['content'] }
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
  end

  describe '#header_logo' do
    it 'returns only the site title if the header image is not present' do
      site_chrome = SocrataSiteChrome::SiteChrome.new(site_chrome_config)
      RequestStore.store[:site_chrome] = site_chrome
      allow(helper).to receive(:logo).and_return(nil)
      result = helper.header_logo
      expect(result).to eq('<a class="logo" href="/"><span class="site-name"></span></a>')
    end

    it 'returns both the site title and the header image' do
      site_chrome = SocrataSiteChrome::SiteChrome.new(site_chrome_config)
      RequestStore.store[:site_chrome] = site_chrome
      result = helper.header_logo
      expect(result).to eq('<a class="logo" href="/"><img alt="test header" onerror="this.style.display=&quot;none&quot;" src="http://i.imgur.com/rF2EJ4P.gif" /><span class="site-name"></span></a>')
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
      allow(helper).to receive(:footer_title).and_return(nil)
      test_time = Time.parse('Jan 1 1984')
      allow(Time).to receive(:now).and_return(test_time)
      expect(helper.copyright).to eq("\u00A9 1984")
    end

    it 'returns the copyright and year and site name' do
      allow(helper).to receive(:footer_title).and_return(%Q(Seattle's silly data!))
      test_time = Time.parse('Jan 1 1984')
      allow(Time).to receive(:now).and_return(test_time)
      expect(helper.copyright).to eq(%Q(\u00A9 1984, Seattle's silly data!))
    end
  end

  describe '#social_link_classname' do
    it 'returns the icon classname regardless of symbol vs string and capitalization' do
      result = helper.social_link_classname('FacEboOk')
      result2 = helper.social_link_classname(:facebook)
      expect(result).to eq(result2)
      expect(result).to eq('icon-facebook')
    end
  end

  describe '#valid_social_links' do
    it 'returns only links with a url present' do
      test_links = [
        { 'type': 'facebook', 'url': 'http://facebook.com/bobsaget' },
        { 'type': 'twitter', 'url': '' }
      ]

      result = helper.valid_social_links(test_links)
      expect(result).to match_array([{ 'type': 'facebook', 'url': 'http://facebook.com/bobsaget' }])
    end
  end

  describe '#valid_links' do
    it 'returns only links with a key and url present' do
      test_links = [
        { 'key': 'a', 'url': 'http://google.com' },
        { 'key': 'b', 'url': 'http://bing.com' },
        { 'key': '', 'url': 'http://facebook.com' },
        { 'key': 'd', 'url': '' },
        { 'key': '', 'url': '' }
      ]

      valid_links = [
        { 'key': 'a', 'url': 'http://google.com' },
        { 'key': 'b', 'url': 'http://bing.com' }
      ]

      result = helper.valid_links(test_links)
      expect(result).to match_array(valid_links)
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
end
