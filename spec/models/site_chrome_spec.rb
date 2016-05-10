require 'rails_helper'

describe SiteChrome do
  describe 'site chrome model' do
    # A subset of these are necessary when you want to change something in core
    def cookies
      {
        'remember_token' => 'eR9ZWVZCdcvcpTOw8ouyJA',
        'logged_in' => 'true',
        'mp_mixpanel__c' => '7',
        'mp_mixpanel__c3' => '12706',
        'mp_mixpanel__c4' => '9207',
        'mp_mixpanel__c5' => '64',
        '_socrata_session_id' => 'BAh7B0kiD3Nlc3Npb25faWQGOgZFRiIlNjIyNDc1MGIwMzMwNzJlODhlNTM1MTE1ZDc1MTRkODBJIhBfY3NyZl90b2tlbgY7AEZJIjFSNXVEeWR6b01ZaHFzQjViQWpGbytVWXNVUnhFa3QvNXV0aVgxbGlCaTZrPQY7AEY=--87c50ef28e9e16cf40637e33bd29d821aa9142aa',
        'socrata-csrf-token' => 'R5uDydzoMYhqsB5bAjFo+UYsURxEkt/5utiX1liBi6k=',
        '_core_session_id' => 'ODNueS13OXplIDE0NjI4Mzc4NzUgYjE2YjUxZDk3NWY0IDBiMTRjNTc4ZmQ5NDZhMjdjNGUyZDUwYjRkMzI1ZjFkZjRiOTIyY2Q'
      }.map { |k, v| "#{k}=#{v}" }.join(';')
    end

    # If you re-record the VCR cassettes, this will likely change along with the auth cookies above
    def site_chrome_id
      86
    end

    it 'can instantiate' do
      expect { SiteChrome.new }.to_not raise_error(Exception)
    end

    it 'can create in core' do
      VCR.use_cassette('site_chrome_create_to_core') do
        site_chrome = SiteChrome.new(
          name: 'Site Chrome',
          default: true,
          domainCName: 'localhost',
          type: 'site_chrome'
        )
        site_chrome.cookies = cookies

        expect(site_chrome.create).to be_instance_of(SiteChrome)
        expect(site_chrome.properties).to be_empty
        expect(site_chrome.updatedAt).not_to be_nil
      end
    end

    it 'can load from core' do
      VCR.use_cassette('site_chrome_load_from_core') do
        site_chrome = SiteChrome.find_one(site_chrome_id)
        expect(site_chrome.create).to be_instance_of(SiteChrome)
        expect(site_chrome.updatedAt).not_to be_nil
      end
    end

    it 'can reload from core' do
      VCR.use_cassette('site_chrome_reload_from_core') do
        site_chrome = SiteChrome.find_one(site_chrome_id)
        reloaded = site_chrome.reload
        expect(site_chrome).to be(reloaded)
      end
    end

    it 'can create a property' do
      VCR.use_cassette('site_chrome_create_property') do
        site_chrome = SiteChrome.find_one(site_chrome_id)
        site_chrome.cookies = cookies

        expect(site_chrome.property('propertyName')).to be_nil
        site_chrome.create_property(
          'propertyName',
          'some key' => 'some value', 'some other key' => 'some other value'
        )
        expect(site_chrome.properties).not_to be_nil
        expect(site_chrome.properties).not_to be_empty

        expect(site_chrome.property('propertyName')).
          to eq(
            'name' => 'propertyName',
            'value' => {
              'some key' => 'some value',
              'some other key' => 'some other value'
            }
          )
      end
    end

    it 'can reload properties' do
      VCR.use_cassette('site_chrome_reload_properties') do
        site_chrome = SiteChrome.find_one(site_chrome_id)
        before = site_chrome.marshal_dump
        after = site_chrome.reload_properties.marshal_dump
        expect(after).to be(before)
      end
    end

    # Updates are full-body all-or-nothing
    it 'can update a property' do
      VCR.use_cassette('site_chrome_update_property') do
        site_chrome = SiteChrome.find_one(site_chrome_id)
        site_chrome.cookies = cookies

        expect(site_chrome.property('propertyName')).
          to eq(
            'name' => 'propertyName',
            'value' => {
              'some key' => 'some value',
              'some other key' => 'some other value'
            }
          )

        site_chrome.update_property(
          'propertyName',
          'some key' => 'another value', 'new key' => 'new value'
        )

        expect(site_chrome.property('propertyName')).
          to eq(
            'name' => 'propertyName',
            'value' => {
              'some key' => 'another value',
              'new key' => 'new value'
            }
          )

        # Property order is not guaranteed but here we have only one property
        before = site_chrome.marshal_dump
        after = site_chrome.reload_properties.marshal_dump
        expect(after).to be(before)
      end
    end
  end
end
