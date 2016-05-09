require 'httparty'

# SiteChrome is the styled header/footer available from configurations.json?type=site_chrome
#
# WARN: Due to OpenStruct, instead of undefined symbols throwing NameError, they will return nil
# TODO: If we really finalize the site-chrome data structure, use actual attributes
# NOTE: It's just a configuration with a fixed type, probably safe to finalize and remove OpenStruct
class SiteChrome < OpenStruct
  include HTTParty
  base_uri CORESERVICE_URI.to_s
  format :json

  # For talking to core
  attr_accessor :request_id, :cookies, :errors

  # TODO: append_error and clear_errors

  def clear_errors
    @errors = []
  end

  def self.default_values
    {
      name: 'Site Chrome',
      default: false,
      domainCName: 'localhost',
      type: SiteChrome.core_configuration_type,
      properties: []
    }
  end

  def initialize(hash = {})
    clear_errors
    super(SiteChrome.default_values.merge(hash))
  end

  def self.auth_cookie_string
    {"remember_token"=>"eR9ZWVZCdcvcpTOw8ouyJA", "logged_in"=>"true", "mp_mixpanel__c"=>"7", "mp_mixpanel__c3"=>"12706", "mp_mixpanel__c4"=>"9207", "mp_mixpanel__c5"=>"64", "_socrata_session_id"=>"BAh7B0kiD3Nlc3Npb25faWQGOgZFRiIlNjIyNDc1MGIwMzMwNzJlODhlNTM1MTE1ZDc1MTRkODBJIhBfY3NyZl90b2tlbgY7AEZJIjFSNXVEeWR6b01ZaHFzQjViQWpGbytVWXNVUnhFa3QvNXV0aVgxbGlCaTZrPQY7AEY=--87c50ef28e9e16cf40637e33bd29d821aa9142aa", "socrata-csrf-token"=>"R5uDydzoMYhqsB5bAjFo+UYsURxEkt/5utiX1liBi6k=", "_core_session_id"=>"ODNueS13OXplIDE0NjI4Mzc4NzUgYjE2YjUxZDk3NWY0IDBiMTRjNTc4ZmQ5NDZhMjdjNGUyZDUwYjRkMzI1ZjFkZjRiOTIyY2Q"}.map { |k, v| "#{k}=#{v}" }.join(';')
  end

  def request_headers
    {
      'Content-Type' => 'application/json',
      'Cookie' => SiteChrome.auth_cookie_string,
      'X-Socrata-Host' => 'localhost'
    }
  end

  # maybe not needed
  def self.model_name
    class_name.underscore
  end

  def self.core_configurations_path
    '/configurations'
  end

  def self.core_configuration_type
    'site_chrome' # or SiteChrome.name.underscore
  end

  # I live in properties[] where properties[x]['name'] == 'siteChromeConfigVars'
  def self.core_configuration_property_name
    'siteChromeConfigVars'
  end

  def self.find(*args)
    Rails.logger.error("SiteChrome.find called with args: #{args.inspect}")
    raise 'not implemented!! SiteChrome is not an AR model'
  end

  def self.all
    options = { query: { type: core_configuration_type }, timeout: 5 }
    res = get(core_configurations_path, options)
    res.map { |site_chrome| new(site_chrome) }
  end

  def self.find_one(id)
    path = "#{core_configurations_path}/#{id}"
    res = get(path, timeout: 5)
    new(res) if res.success? && res['type'] == core_configuration_type
  end

  #######################################################
  # Shortcut accessors (config & published)
  # NOTE: You can use these like s.content['some_key'] = 'some_value'
  # or you can do s.content.merge!('key' => 'value')
  # BUT: s.content = { 'key' => 'value', 'thing' => 'other_thing' } will not work!

  def property(property_name)
    properties.find { |key, _| key['name'] == property_name.to_s }
  end

  def config
    property(SiteChrome.core_configuration_property_name)
  end

  def published
    config['value']['versions']['0.1']['published']
  end

  def content
    published['content']
  end

  ##################
  # NOTE: very proto
  def update_published_content(new_content_hash)
    new_content = content.merge(new_content_hash)

    wrapped_up = { 'versions' => { '0.1' => { 'published' => { 'content' => new_content } } } }

    update_property(SiteChrome.core_configuration_property_name, wrapped_up)
  end

  # TODO: I'd like to be able to save and have both main & properties update automatically
  def save
    raise 'There is no save! First create, then update_properties.'
  end

  # Ideal workflow:
  # sc = SiteChrome.new
  # sc.properties = { 'name' => 'siteChromeConfigVars', 'value' => 'some hash of values' }
  # sc.save
  #
  # Actual workflow (because of how core handles site configs and properties)
  # sc = SiteChrome.new
  # sc.create
  # sc.update_property = { 'siteChromeConfigVars' => 'some hash of values' }

  def handle_configuration_response(res)
    if res.success?
      clear_errors
      res.each do |key, value|
        send("#{key}=", value) # because of OStruct
      end
      self
    else
      self.errors = res.to_a
      false
    end
  end

  # Step 1: create a site theme configuration
  def create
    res = SiteChrome.post(
      SiteChrome.core_configurations_path,
      headers: request_headers,
      body: marshal_dump.to_json,
      timeout: 5
    )

    handle_configuration_response(res)
  end

  def properties_path
    "#{SiteChrome.core_configurations_path}/#{id}/properties"
  end

  # Update myself according to the response from a property query to core
  def handle_property_response(res)
    if res.success?
      clear_errors
      name = res['name']
      value = res['value']

      # Check if property already exists
      existing_property = property(name)
      if existing_property
        existing_property['value'] = value
      else
        # This can produce out-of-order properties array
        properties << { 'name' => name, 'value' => value }
      end
      self
    else
      self.errors = res.to_a
      false
    end
  end

  # Step 2: Create a siteChromeConfigVars property
  def create_property(property_name, property_value)
    # Q: createdAt shows up on create but never again?
    res = SiteChrome.post(
      properties_path,
      headers: request_headers,
      body: { name: property_name, value: property_value }.to_json,
      timeout: 5
    )

    handle_property_response(res)
  end

  # Step 3: Update the siteChromeConfigVars property as desired
  def update_property(property_name, property_value)
    res = SiteChrome.put(
      properties_path,
      headers: request_headers,
      query: { method: :update }, # WARN: Necessary for Core to accept a put
      body: { name: property_name, value: property_value }.to_json,
      timeout: 5
    )

    handle_property_response(res)
  end

  # TODO: use response handler
  def reload_properties
    res = SiteChrome.get(properties_path, timeout: 5)
    res.success? && self.properties = res.to_a
    self
  end

  def reload
    path = "#{SiteChrome.core_configurations_path}/#{id}"
    res = SiteChrome.get(path, timeout: 5)
    handle_configuration_response(res)
  end
end
