require 'httparty'

# SiteChrome is the styled header/footer available from configurations.json?type=site_chrome
class SiteChrome
  include HTTParty
  base_uri CORESERVICE_URI.to_s
  format :json

  # For talking with core
  attr_accessor :cookies, :errors, :request_id

  # Attribute fields of Configuration as surfaced by core.
  def self.attribute_names
    %w(id name default domainCName type updatedAt properties)
  end
  attribute_names.each { |field| attr_accessor field }

  def clear_errors
    @errors = []
  end

  def self.host
    cname = CurrentDomain.cname
    cname.present? ? cname : 'localhost'
  end

  def self.default_values
    {
      name: 'Site Chrome',
      default: true,
      domainCName: SiteChrome.host,
      type: SiteChrome.core_configuration_type,
      properties: []
    }
  end

  def attributes
    SiteChrome.attribute_names.each_with_object({}) do |field, hash|
      hash[field] = instance_variable_get("@#{field}")
    end
  end

  def assign_attributes(attributes)
    attributes.each do |key, value|
      next unless SiteChrome.attribute_names.include?(key.to_s)
      instance_variable_set("@#{key}", value)
    end
  end

  # NOTE: use for local development to authenticate from console
  def self.local_dev_box_auth_cookies
    {}.map { |key, value| "#{key}=#{value}" }.join(';')
  end

  def initialize(attributes = nil)
    @cookies = nil # SiteChrome.local_dev_box_auth_cookies
    clear_errors
    initial_attributes = SiteChrome.default_values
    initial_attributes.merge!(attributes) if attributes
    assign_attributes(initial_attributes)
  end

  ####################
  # Shortcut accessors

  def property(property_name)
    properties.find { |key, _| key['name'] == property_name.to_s }
  end

  def config
    property(SiteChrome.core_configuration_property_name)
  end

  def published
    config['value']['versions']['0.1']['published']
  end

  # Use like s.content['some_key'] = 'some_value' or s.content.merge!('key' => 'value')
  # But, s.content = { 'key' => 'value', 'thing' => 'other_thing' } will not work!
  def content
    published['content']
  end

  #######
  # Paths

  def self.core_configurations_path
    '/configurations'
  end

  def self.core_configuration_type
    'site_chrome' # or SiteChrome.name.underscore
  end

  def properties_path
    "#{SiteChrome.core_configurations_path}/#{id}/properties"
  end

  # I live in properties[] where properties[x]['name'] == 'siteChromeConfigVars'
  def self.core_configuration_property_name
    'siteChromeConfigVars'
  end

  def request_headers
    {
      'Content-Type' => 'application/json',
      'Cookie' => @cookies,
      'X-Socrata-Host' => SiteChrome.host
    }.compact
  end

  #######################
  # The Calls to Cthorehu

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

  def self.find_default
    all.find(&:default)
  end

  # Step 1: create a site theme configuration
  def create
    res = SiteChrome.post(
      SiteChrome.core_configurations_path,
      headers: request_headers,
      body: attributes,
      timeout: 5
    )

    handle_configuration_response(res)
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

  def update_published_content(new_content_hash)
    new_content = content.merge(new_content_hash)
    wrapped_up = { 'versions' => { '0.1' => { 'published' => { 'content' => new_content } } } }
    update_property(SiteChrome.core_configuration_property_name, wrapped_up)
  end

  def reload_properties
    res = SiteChrome.get(properties_path, timeout: 5)
    res.success? && self.properties = res.to_a && self
  end

  def reload
    path = "#{SiteChrome.core_configurations_path}/#{id}"
    res = SiteChrome.get(path, timeout: 5)
    handle_configuration_response(res)
  end

  private

  ###################
  # Response handlers

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
end
