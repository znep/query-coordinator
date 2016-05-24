require 'rails_helper'

describe SiteChrome do
  describe 'site chrome model' do
    # NOTE: To re-record the VCR cassettes:
    # * Log in to FE locally against local core
    # * Copy your local auth cookies to auth_cookies_for_vcr_tapes
    # * Recommend going one test at a time, e.g.:
    #   rm spec/fixtures/vcr_cassettes/site_chrome/model/find_or_create.yml
    #   rspec spec/models/site_chrome_spec.rb:53

    def auth_cookies_for_vcr_tapes
      {
        'logged_in' => 'true',
        '_socrata_session_id' => 'BAh7B0kiD3Nlc3Npb25faWQGOgZFRiIlNzU5ZDUzMzM4MjUxMTBjMDk5ZDdmYzZhMzI5MmZkOTFJIhBfY3NyZl90b2tlbgY7AEZJIjFaK0JsRE9YN1lGWFc0WDMrMmRtZXlXcnJZU1d6b2hTdGYzQVBDUnJnWlhFPQY7AEY=--61804bb14954b9cb66c8e28658089e1abaf88894',
        'socrata-csrf-token' => 'Z+BlDOX7YFXW4X3+2dmeyWrrYSWzohStf3APCRrgZXE=',
        '_core_session_id' => 'ODNueS13OXplIDE0NjQxMzUxODEgNGFhZjZjYjhkYzhiIDdhMTM3NWE4ZTZhZDU0MmYzNzA1NWI2ZmMyNTU2ZGJhNmI1ODQ5M2Q'
      }.map { |key, value| "#{key}=#{value}" }.join(';')
    end

    it 'can instantiate' do
      expect { SiteChrome.new }.to_not raise_error(Exception)
    end

    it 'can create' do
      VCR.use_cassette('site_chrome/model/create') do
        site_chrome = SiteChrome.new(
          name: 'Site Chrome',
          default: false, # so that find_default won't find this
          domainCName: 'localhost',
          type: 'site_chrome'
        )
        site_chrome.cookies = auth_cookies_for_vcr_tapes

        res = site_chrome.create
        expect(res).to be_instance_of(SiteChrome)
        expect(site_chrome.id).not_to be_nil
        expect(site_chrome.default).to be false # find_default should not find us
        expect(site_chrome.properties).to be_empty
        expect(site_chrome.updatedAt).not_to be_nil
      end
    end

    it 'can find or create default' do
      VCR.use_cassette('site_chrome/model/find_or_create') do
        site_chrome = SiteChrome.find_or_create_default(auth_cookies_for_vcr_tapes)
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

    # If you re-record the VCR-tapes, you might have to change this property name
    def new_property_name
      'youMightNeedToChangeThisIfItAlreadyExists'
    end

    def new_property_value
      { 'some key' => 'some value', 'some other key' => 'some other value' }
    end

    # Note the shared 'some other key' key
    def newer_property_value
      { 'some other key' => 'a new value here', 'a new key' => 'a new value' }
    end

    it 'can create a property' do
      VCR.use_cassette('site_chrome/model/find_default_and_create_property') do
        site_chrome = SiteChrome.find_default
        site_chrome.cookies = auth_cookies_for_vcr_tapes

        expect(site_chrome.property(new_property_name)).to be_nil
        site_chrome.create_property(new_property_name, new_property_value)
        expect(site_chrome.properties).not_to be_nil
        expect(site_chrome.properties).not_to be_empty

        expect(site_chrome.property(new_property_name)).
          to eq('name' => new_property_name, 'value' => new_property_value)
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

    # update_attribute is an all-or-nothing overwrite
    it 'can update property attributes' do
      VCR.use_cassette('site_chrome/model/find_default_and_update_property') do
        site_chrome = SiteChrome.find_default
        site_chrome.cookies = auth_cookies_for_vcr_tapes

        expect(site_chrome.property(new_property_name)).
          to eq('name' => new_property_name, 'value' => new_property_value)
        site_chrome.update_property(new_property_name, newer_property_value)
        expect(site_chrome.property(new_property_name)).
          to eq('name' => new_property_name, 'value' => newer_property_value)

        # Make sure that reloading works (i.e., we actually saved the record)
        # Property order is not guaranteed but here we should have only one property
        before = site_chrome.attributes
        after = site_chrome.reload_properties.attributes
        expect(after).to eq(before)

        # Now swap it back
        site_chrome.update_property(new_property_name, new_property_value)
        expect(site_chrome.property(new_property_name)).
          to eq('name' => new_property_name, 'value' => new_property_value)

        # And test reloading (to see if we actually saved) again
        before = site_chrome.attributes
        after = site_chrome.reload_properties.attributes
        expect(after).to eq(before)
      end
    end

    # Update published content (via deep merge) also works when published content does not yet exist
    it 'can update published content when siteChromeConfigVars does not exist' do
      VCR.use_cassette('site_chrome/model/find_or_create_default_and_update_published_content') do
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
  end
end
