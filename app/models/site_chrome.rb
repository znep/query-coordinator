require 'httparty'

# SiteChrome is the styled header/footer available from configurations.json?type=site_chrome
#
# NOTE: Posting and putting to Core requires authentication. If you want to use the model locally in
# your console, you'll need to set the site cookie. Here is one approach:
#   Fetch the cookies from a valid session
#     Add `STDOUT.puts cookies.inspect` somewhere (e.g., lib/user_auth_methods.rb)
#     Run the server locally and log in with your dev account
#     Copy the cookies into a file, environment variable, or the model class
#   Set the cookies on your SiteChrome instance
#     sc.cookies = {cookies hash}.map { |key, value| "#{key}=#{value}" }.join(';')
#
class SiteChrome
  include HTTParty

  base_uri CORESERVICE_URI.to_s
  default_timeout 5 # seconds
  format :json

  # For authenticating with and talking to core
  # cookies is a string e.g., "cookie_name=cookie_value;other_cookie=other_value"
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
    cname = CurrentDomain.cname # CurrentDomain can be "" on local box
    cname.present? ? cname : 'localhost'
  end

  def self.default_values
    {
      name: 'Site Chrome',
      default: true,
      domainCName: SiteChrome.host,
      type: SiteChrome.core_configuration_type,
      properties: [] # separate db records, must be created later
    }
  end

  def self.latest_version
    '0.3'
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

  def initialize(attributes = nil)
    @cookies = nil # Remember to set you cookies if you want to do any posting/putting!
    clear_errors
    initial_attributes = SiteChrome.default_values
    initial_attributes.merge!(attributes) if attributes
    assign_attributes(initial_attributes)
  end

  ####################
  # Shortcut accessors
  # TODO: rewrite with `dig` after Ruby upgrade

  def property(property_name)
    properties.find { |key, _| key['name'] == property_name.to_s }
  end

  def config
    property(SiteChrome.core_configuration_property_name) || {}
  end

  def current_version
    if config.present? && config.dig('value', 'versions').present?
      config.dig('value', 'current_version') || latest_published_version
    else
      # No existing data, use latest version
      SiteChrome.latest_version
    end

  end

  def latest_published_version
    config.dig('value', 'versions').keys.map { |version| Gem::Version.new(version) }.max.to_s
  end

  publication_stages = %w(draft published)

  def published
    # TODO: these things:
    # * Factor out paths
    # * Rewrite as inject (or dig in >= 2.3)
    # * Rewrite update_published_content to use paths as well
    config.
      try(:[], 'value').
      try(:[], 'versions').
      try(:[], current_version).
      try(:[], 'published')
  end

  # Use like s.content['some_key'] = 'some_value' or s.content.merge!('key' => 'value')
  # But, s.content = { 'key' => 'value', 'thing' => 'other_thing' } will not work!
  def content
    published.try(:[], 'content')
  end

  publication_stages.each do |stage|
    define_method "#{stage}_content" do
      config.dig('value', 'versions', current_version, stage, 'content')
    end
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

  # I live in properties[] where properties[x]['name'] ==
  def self.core_configuration_property_name
    'siteChromeConfigVars'
  end

  def authorized_request_headers
    SiteChrome.default_request_headers.merge('Cookie' => @cookies)
  end

  def self.default_request_headers
    {
      'Content-Type' => 'application/json', # this is necessary despite format :json above
      'X-Socrata-Host' => SiteChrome.host
    }
  end

  #######################
  # The Calls to Cthorehu

  def self.all(opts = {})
    options = opts.deep_merge(
      query: { type: core_configuration_type },
      headers: default_request_headers
    )
    res = get(core_configurations_path, options)
    res.map { |site_chrome| new(site_chrome) }
  end

  def self.find_one(id)
    path = "#{core_configurations_path}/#{id}"
    res = get(path, default_request_headers)
    new(res) if res.success? && res['type'] == core_configuration_type
  end

  def self.find_default
    opts = { query: { defaultOnly: true } }
    all(opts).find(&:default)
  end

  def self.find_or_create_default(cookies)
    find_default || begin
      sc = SiteChrome.new(default_values)
      sc.cookies = cookies
      sc.create
    end
  end

  def create_or_update_property(property_name, property_value)
    if property(property_name)
      update_property(property_name, property_value)
    else
      create_property(property_name, property_value)
    end
  end

  # Step 1: create a site theme configuration
  def create
    res = SiteChrome.post(
      SiteChrome.core_configurations_path,
      headers: authorized_request_headers,
      body: attributes.to_json
    )

    handle_configuration_response(res)
  end

  # Step 2: Create a siteChromeConfigVars property
  def create_property(property_name, property_value)
    # Q: createdAt shows up on create but never again?
    res = SiteChrome.post(
      properties_path,
      headers: authorized_request_headers,
      body: { name: property_name, value: property_value }.to_json
    )

    handle_property_response(res)
  end

  # Step 3: Update the siteChromeConfigVars property as desired
  def update_property(property_name, property_value)
    res = SiteChrome.put(
      properties_path,
      headers: authorized_request_headers,
      query: { method: :update }, # WARN: Necessary for Core to accept a put
      body: { name: property_name, value: property_value }.to_json
    )

    handle_property_response(res)
  end

  # WARN: deep merge!
  publication_stages.each do |stage|
    define_method "update_#{stage}_content" do |new_content_hash|
      all_versions_content = config.dig('value') || {
        'versions' => {}
      }
      new_content = (send(:"#{stage}_content") || {}).deep_merge(new_content_hash)
      all_versions_content['current_version'] = current_version
      all_versions_content.bury('versions', current_version, stage, 'content', new_content)
      create_or_update_property(SiteChrome.core_configuration_property_name, all_versions_content)
    end
  end

  def update_content(publication_stage, new_content_hash)
    meth = :"update_#{publication_stage}_content"
    if respond_to?(meth)
      send(meth, new_content_hash)
    else
      @errors << "Publication Stage #{publication_stage} unknown."
    end
  end

  def reload_properties
    res = SiteChrome.get(properties_path, SiteChrome.default_request_headers)
    if res.success?
      self.properties = res.to_a
      self
    else
      false
    end
  end

  def reload
    path = "#{SiteChrome.core_configurations_path}/#{id}"
    res = SiteChrome.get(path, SiteChrome.default_request_headers)
    handle_configuration_response(res)
  end

  private

  ###################
  # Response handlers

  def handle_configuration_response(res)
    if res.success?
      clear_errors
      res.each do |key, value|
        send("#{key}=", value) # TODO: this cleanly
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
