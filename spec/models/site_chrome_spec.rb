require 'rails_helper'

describe SiteChrome do

  include TestHelperMethods

  describe 'site chrome model' do
    before(:all) do
      init_current_domain
    end

    # NOTE: To re-record the VCR cassettes:
    # * Log in to FE locally against local core
    # * Copy your local auth cookies to auth_cookies_for_vcr_tapes
    # * Recommend going one test at a time, e.g.:
    #   rm spec/fixtures/vcr_cassettes/site_chrome/model/find_or_create.yml
    #   rspec spec/models/site_chrome_spec.rb:53

    def auth_cookies_for_vcr_tapes
      {
        'logged_in' => 'true',
        '_socrata_session_id' => 'BAh7CkkiD3Nlc3Npb25faWQGOgZFRkkiJWYyNWQxZjg4OTE1NDMzYjQ5OWQwOThlMzU0MGY0NGM4BjsARkkiCXVzZXIGOwBGaQdJIhBfY3NyZl90b2tlbgY7AEZJIjFQK0s4VUwyQ0pLWGwxTGJ4N1pjWnJQa1JDU05LZk1aVXNwcm9ZdkZaYXR3PQY7AEZJIg5yZXR1cm5fdG8GOwBGMEkiCWluaXQGOwBUVA%3D%3D--699b5f9b224d3e5048e3fc67f21bbe5360c64bad',
        'socrata-csrf-token' => '54gROK00FX2R282cbnkZH%2FnxXDNOx885dPhHlZbf%2FT7Yaq1oELYx2HQPe22D7gCzAOBVEAS7CW3GYq%2F3Z4aX4g%3D%3D',
        '_core_session_id' => 'dHVnZy1pa2NlIDE0NzU2NDE1NzMgZDQzOGJkNjNhZTc2IDc3NWVmMDc4MGM0NmE2NjZmZDU4ZWUzNzIyMTVjODA4MmYzYTM1Mzk%3D'
      }.map { |key, value| "#{key}=#{value}" }.join(';')
    end

    it 'can instantiate' do
      expect { SiteChrome.new }.to_not raise_error(Exception)
    end

    it 'can create' do
      VCR.use_cassette('site_chrome/model/create') do
        site_chrome = SiteChrome.new(
          name: 'Site Chrome',
          default: false, # so that find won't find this
          domainCName: 'localhost',
          type: 'site_chrome'
        )
        site_chrome.cookies = auth_cookies_for_vcr_tapes

        res = site_chrome.create
        expect(res).to be_instance_of(SiteChrome)
        expect(site_chrome.id).not_to be_nil
        expect(site_chrome.default).to be false # find should not find us
        expect(site_chrome.properties).to be_empty
        expect(site_chrome.updatedAt).not_to be_nil
      end
    end

    it 'can create a site chrome config' do
      VCR.use_cassette('site_chrome/model/create_site_chrome_config') do
        site_chrome = SiteChrome.create_site_chrome_config(auth_cookies_for_vcr_tapes)

        expect(site_chrome).to be_instance_of(SiteChrome)
        expect(site_chrome.id).not_to be_nil
        expect(site_chrome.default).to be true # should be default
        expect(site_chrome.updatedAt).not_to be_nil
      end
    end

    it 'can find a site chrome for CurrentDomain' do
      VCR.use_cassette('site_chrome/model/find_mydomain') do
        site_chrome = SiteChrome.find
        expect(site_chrome).to be_instance_of(SiteChrome)
        expect(site_chrome.id).not_to be_nil
        expect(site_chrome.default).to be true # should be default
        expect(site_chrome.updatedAt).not_to be_nil
      end
    end

    def new_property_value
      { 'some key' => 'some value', 'some other key' => 'some other value' }
    end

    # Note the shared 'some other key' key
    def newer_property_value
      { 'some other key' => 'a new value here', 'a new key' => 'a new value' }
    end

    # Disabling these next three tests. They are very brittle, and rely on reading changed data
    # from VCR cassettes, causing problems. TODO: Convert them to cheetah tests

    # xit 'can create a property' do
    #   VCR.use_cassette('site_chrome/model/find_and_create_property') do
    #     new_property_name = "newProperty#{Time.now}"
    #     site_chrome = SiteChrome.find
    #     site_chrome.cookies = auth_cookies_for_vcr_tapes

    #     expect(site_chrome.property(new_property_name)).to be_nil
    #     site_chrome.create_property(new_property_name, new_property_value)
    #     expect(site_chrome.properties).not_to be_nil
    #     expect(site_chrome.properties).not_to be_empty

    #     expect(site_chrome.property(new_property_name)).
    #       to eq('name' => new_property_name, 'value' => new_property_value)
    #   end
    # end

    # xit 'can reload properties' do
    #   VCR.use_cassette('site_chrome/model/find_and_reload_properties') do
    #     site_chrome = SiteChrome.find
    #     before = site_chrome.attributes
    #     after = site_chrome.reload_properties.attributes
    #     expect(after).to eq(before)
    #   end
    # end

    # # update_attribute is an all-or-nothing overwrite
    # xit 'can update property attributes' do
    #   VCR.use_cassette('site_chrome/model/find_and_update_property') do
    #     new_property_name = "newProperty#{Time.now}"
    #     site_chrome = SiteChrome.find
    #     site_chrome.cookies = auth_cookies_for_vcr_tapes
    #     site_chrome.create_property(new_property_name, new_property_value)

    #     expect(site_chrome.property(new_property_name)).
    #       to eq('name' => new_property_name, 'value' => new_property_value)
    #     site_chrome.update_property(new_property_name, newer_property_value)
    #     expect(site_chrome.property(new_property_name)).
    #       to eq('name' => new_property_name, 'value' => newer_property_value)

    #     # Make sure that reloading works (i.e., we actually saved the record)
    #     # Property order is not guaranteed but here we should have only one property
    #     before = site_chrome.attributes
    #     after = site_chrome.reload_properties.attributes
    #     expect(after).to eq(before)

    #     # Now swap it back
    #     site_chrome.update_property(new_property_name, new_property_value)
    #     expect(site_chrome.property(new_property_name)).
    #       to eq('name' => new_property_name, 'value' => new_property_value)

    #     # And test reloading (to see if we actually saved) again
    #     before = site_chrome.attributes
    #     after = site_chrome.reload_properties.attributes
    #     expect(after).to eq(before)
    #   end
    # end

    # Update published content (via deep merge) also works when published content does not yet exist
    it 'can update published content when siteChromeConfigVars does not exist' do
      VCR.use_cassette('site_chrome/model/find_and_update_published_content') do
        site_chrome = SiteChrome.new(default: false)
        site_chrome.cookies = auth_cookies_for_vcr_tapes
        res = site_chrome.create
        expect(res).not_to be(false) # make sure it saves
        expect(res.errors).to be_empty

        fancy_new_property = { 'evenNewerPropertyName' => { 'first key' => 'first value' } }
        site_chrome.update_published_content(fancy_new_property)

        expect(site_chrome.content).to include(fancy_new_property)

        before = site_chrome.attributes
        after = site_chrome.reload_properties.attributes
        expect(after).to eq(before)
      end
    end

    def default_site_chrome
      SiteChrome.new(
        name: 'Site Chrome',
        default: false, # so that find won't find this
        domainCName: 'localhost',
        type: 'site_chrome'
      )
    end

    describe '#current_version' do
      it 'returns the latest version if no config is present' do
        site_chrome = default_site_chrome
        allow(site_chrome).to receive(:config).and_return(nil)
        allow(SiteChrome).to receive(:latest_version).and_return('0.1.2.3')
        expect(site_chrome.current_version).to eq('0.1.2.3')
      end

      it 'returns the latest version if a config is present but does not have the a versions key' do
        site_chrome = default_site_chrome
        allow(site_chrome).to receive(:config).and_return(value: {})
        allow(SiteChrome).to receive(:latest_version).and_return('4.5.6')
        expect(site_chrome.current_version).to eq('4.5.6')
      end

      it 'returns the current version specified in the config instead of the latest version' do
        site_chrome = default_site_chrome
        allow(site_chrome).to receive(:config).and_return(
          'value' => {
            'versions' => { '1.2': {}},
            'current_version' => '1.2'
          }
        )
        allow(SiteChrome).to receive(:latest_version).and_return('4.5.6')
        expect(site_chrome.current_version).to eq('1.2')
      end
    end

    describe '#set_activation_state' do
      it 'should update the Site Chrome property when state == entire_site' do
        site_chrome = default_site_chrome
        expected_config = SiteChrome.default_site_chrome_config['value'].tap do |config|
          config['activation_state'] = { 'open_data' => true, 'homepage' => true, 'data_lens' => true }
        end

        expect(site_chrome).to receive(:create_or_update_property).with(
          SiteChrome.core_configuration_property_name,
          expected_config
        )
        site_chrome.set_activation_state('entire_site' => true)
      end

      it 'should update the Site Chrome property when state == all_pages_except_home' do
        site_chrome = default_site_chrome
        expected_config = SiteChrome.default_site_chrome_config['value'].tap do |config|
          config['activation_state'] = { 'open_data' => true, 'homepage' => false, 'data_lens' => true }
        end

        expect(site_chrome).to receive(:create_or_update_property).with(
          SiteChrome.core_configuration_property_name,
          expected_config
        )
        site_chrome.set_activation_state('all_pages_except_home' => true)
      end

      it 'should update the Site Chrome property when state == revert_site_chrome' do
        site_chrome = default_site_chrome
        expected_config = SiteChrome.default_site_chrome_config['value'].tap do |config|
          config['activation_state'] = { 'open_data' => false, 'homepage' => false, 'data_lens' => false }
        end

        expect(site_chrome).to receive(:create_or_update_property).with(
          SiteChrome.core_configuration_property_name,
          expected_config
        )
        site_chrome.set_activation_state('revert_site_chrome' => true)
      end
    end

    describe '.site_chrome_config' do

      it 'returns the parsed JSON of the default site chrome configuration' do
        VCR.use_cassette('site_chrome_config') do
          response = SiteChrome.site_chrome_config
          expect(response['name']).to eq('Site Chrome')
          expect(response['default']).to eq(true)
          expect(response['type']).to eq('site_chrome')
        end
      end
    end

    describe '.site_chrome_property_exists?' do

      it 'returns false if a property does not exist' do
        VCR.use_cassette('site_chrome_property') do
          SiteChrome.find
          result = SiteChrome.site_chrome_property_exists?('fake_property')
          expect(result).to be(false)
        end
      end

      it 'returns true if a property does exist' do
        VCR.use_cassette('site_chrome_property') do
          SiteChrome.find
          result = SiteChrome.site_chrome_property_exists?('siteChromeConfigVars')
          expect(result).to be(true)
        end
      end
    end
  end

end
