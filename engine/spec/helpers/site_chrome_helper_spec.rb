require 'rails_helper'

describe Chrome::ApplicationHelper do
  describe'#logo' do
    it 'returns an image tag with the a src and alt attribute' do
      source = {
        'logo' => {
          'src' => 'http://myimage.png',
          'alt' => 'Goats'
        }
      }
      result = helper.logo(source)
      expect(result).to eq('<img alt="Goats" src="http://myimage.png" />')
    end

    it 'falls back to the site_name if there is no source logo alt' do
      @site_name = 'Goldfinger'
      source = {
        'logo' => {
          'src' => 'http://myimage.png'
        }
      }
      result = helper.logo(source)
      expect(result).to eq('<img alt="Goldfinger" src="http://myimage.png" />')
    end
  end

  describe '#current_user' do
    it 'raises if RequestStore.store is missing :current_user' do
      allow(RequestStore.store).to receive(:has_key?).with(:current_user).and_return(false)
      expect { helper.current_user }.to raise_error(/current_user/)
    end

    it 'returns the contents of RequestStore.store[:current_user]' do
      allow(RequestStore.store).to receive(:has_key?).with(:current_user).and_return(true)
      allow(RequestStore.store).to receive(:[]).with(:current_user).and_return('id' => 'fooo-baar')
      expect(helper.current_user).to eq('id' => 'fooo-baar')
    end
  end

  describe '#logged_in' do
    it 'returns true if current_user is present' do
      allow(helper).to receive(:current_user).and_return('id' => 'fooo-baar')
      expect(helper.logged_in?).to eq(true)
    end

    it 'returns false if current_user is not present' do
      allow(helper).to receive(:current_user).and_return(nil)
      expect(helper.logged_in?).to eq(false)
    end
  end

  describe '#username' do
    it 'returns "Profile" if there is no current_user' do
      allow(RequestStore.store).to receive(:[]).and_return(nil)
      allow(RequestStore.store).to receive(:has_key?).with(:current_user).and_return(true)
      expect(helper.username).to eq('Profile')
    end

    it 'returns "Profile" if there is a current_user with no displayName' do
      allow(RequestStore.store).to receive(:[]).and_return('id' => 'fooo-baar')
      allow(RequestStore.store).to receive(:has_key?).with(:current_user).and_return(true)
      expect(helper.username).to eq('Profile')
    end

    it 'returns the current_user displayName if there is a current_user' do
      allow(RequestStore.store).to receive(:[]).and_return('displayName' => 'derek zoolander')
      allow(RequestStore.store).to receive(:has_key?).with(:current_user).and_return(true)
      expect(helper.username).to eq('derek zoolander')
    end
  end

  describe '#copyright' do
    it 'returns only the copyright and year if there is no site name' do
      allow(helper).to receive(:site_name).and_return(nil)
      test_time = Time.parse('Jan 1 1984')
      allow(Time).to receive(:now).and_return(test_time)
      expect(helper.copyright).to eq("\u00A9 1984")
    end

    it 'returns the copyright and year and site name' do
      allow(helper).to receive(:site_name).and_return(%Q(Seattle's silly data!))
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
