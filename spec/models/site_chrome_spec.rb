require 'rails_helper'

describe SiteChrome do
  describe 'site chrome model' do
    # NOTE: To re-record the VCR cassettes:
    # * Log in to FE locally against local core
    # * Copy the cookies to SiteChrome.local_dev_box_SiteChrome.local_dev_box_auth_cookies
    # * Delete the spec/fixtures/vcr_cassettes/site_chrome/model*.yml
    # * Delete any site chrome configs from your local core (sorry, no test db)
    # * Re-run this test file (i.e., rspec spec/models/site_chrome_spec.rb)

    it 'can instantiate' do
      expect { SiteChrome.new }.to_not raise_error(Exception)
    end

    it 'can create' do
      VCR.use_cassette('site_chrome/model/create_in_core') do
        site_chrome = SiteChrome.new(
          name: 'Site Chrome',
          default: false, # so that find_default won't find this
          domainCName: 'localhost',
          type: 'site_chrome'
        )
        site_chrome.cookies = SiteChrome.local_dev_box_auth_cookies

        res = site_chrome.create
        expect(res).to be_instance_of(SiteChrome)
        expect(site_chrome.id).not_to be_nil
        expect(site_chrome.default).to be false # find_default should not find us
        expect(site_chrome.properties).to be_empty
        expect(site_chrome.updatedAt).not_to be_nil
      end
    end

    it 'can find or create default' do
      VCR.use_cassette('site_chrome/model/find_or_create_default') do
        site_chrome = SiteChrome.find_or_create_default
        expect(site_chrome).to be_instance_of(SiteChrome)
        expect(site_chrome.id).not_to be_nil
        expect(site_chrome.default).to be true # should be default
        expect(site_chrome.updatedAt).not_to be_nil
      end
    end

    it 'can find_default and find_one' do
      VCR.use_cassette('site_chrome/model/find_default_and_find_one') do
        # SiteChrome#find_default
        default_site_chrome = SiteChrome.find_default
        expect(default_site_chrome).to be_instance_of(SiteChrome)
        expect(default_site_chrome.default).to be true
        expect(default_site_chrome.id).not_to be_nil
        expect(default_site_chrome.updatedAt).not_to be_nil

        # SiteChrome#find_one
        site_chrome = SiteChrome.find_one(default_site_chrome.id)
        expect(site_chrome).to be_instance_of(SiteChrome)
        expect(site_chrome.attributes).to eq(default_site_chrome.attributes)
      end
    end

    it 'can load and reload' do
      VCR.use_cassette('site_chrome/model/find_default_and_reload') do
        site_chrome = SiteChrome.find_default
        before_reload = site_chrome.attributes
        after_reload = site_chrome.reload.attributes
        expect(after_reload).to eq(before_reload)
      end
    end

    it 'can create a property' do
      VCR.use_cassette('site_chrome/model/find_default_and_create_property') do
        site_chrome = SiteChrome.find_default
        site_chrome.cookies = SiteChrome.local_dev_box_auth_cookies

        expect(site_chrome.property('newnewPropertyName')).to be_nil
        site_chrome.create_property(
          'newPropertyName',
          'some key' => 'some value', 'some other key' => 'some other value'
        )
        expect(site_chrome.properties).not_to be_nil
        expect(site_chrome.properties).not_to be_empty

        expect(site_chrome.property('newPropertyName')).
          to eq(
            'name' => 'newPropertyName',
            'value' => {
              'some key' => 'some value',
              'some other key' => 'some other value'
            }
          )
      end
    end

    it 'can reload properties' do
      VCR.use_cassette('site_chrome/model/find_default_and_reload_properties') do
        site_chrome = SiteChrome.find_default
        before = site_chrome.attributes
        after = site_chrome.reload_properties.attributes
        expect(after).to eq(before)
      end
    end

    # Updates are full-body all-or-nothing
    it 'can update a property' do
      VCR.use_cassette('site_chrome/model/find_default_and_update_property') do
        site_chrome = SiteChrome.find_default
        site_chrome.cookies = SiteChrome.local_dev_box_auth_cookies # for auth

        expect(site_chrome.property('newPropertyName')).
          to eq(
            'name' => 'newPropertyName',
            'value' => {
              'some key' => 'some value',
              'some other key' => 'some other value'
            }
          )

        site_chrome.update_property(
          'newPropertyName',
          'some key' => 'another value', 'new key' => 'new value'
        )

        expect(site_chrome.property('newPropertyName')).
          to eq(
            'name' => 'newPropertyName',
            'value' => {
              'some key' => 'another value',
              'new key' => 'new value'
            }
          )

        # Property order is not guaranteed but here we have only one property
        before = site_chrome.attributes
        after = site_chrome.reload_properties.attributes
        expect(after).to eq(before)
      end
    end

    # Update published content works when published content does not yet exist
    it 'can update published content when siteChromeConfigVars does not exist' do
      VCR.use_cassette('site_chrome/model/find_or_create_default_and_update_published_content') do
        site_chrome = SiteChrome.find_or_create_default
        site_chrome.cookies = SiteChrome.local_dev_box_auth_cookies

        fancy_new_property = { 'evenNewerPropertyName' => { 'first key' => 'first value' } }
        site_chrome.update_published_content(fancy_new_property)

        expect(site_chrome.content).to include(fancy_new_property)
      end
    end
  end
end
