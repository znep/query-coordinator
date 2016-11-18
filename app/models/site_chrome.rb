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

# Since this class is used in service of the administrative interface and its primary purpose is to make
# changes to the site chrome configuration, we are explicitly not using caching at all.

class SiteChrome
  include HTTParty

  base_uri CORESERVICE_URI.to_s
  default_timeout 5 # seconds
  format :json

  PUBLICATION_STAGES = %w(draft published)

  PUBLICATION_STAGES.each do |stage|
    define_method "#{stage}_content" do
      config.dig('value', 'versions', current_version, stage, 'content')
    end
  end

  # WARN: deep merge!
  PUBLICATION_STAGES.each do |stage|
    # For grepping: update_published_content, update_draft_content
    define_method "update_#{stage}_content" do |new_content_hash|
      all_versions_content = config.dig('value') || { 'versions' => {} }.tap do |content|
        content['current_version'] = current_version
      end

      # Merge new_content localizations with all existing localizations
      all_locales =
        (all_versions_content.dig('versions', current_version, stage, 'content', 'locales') || {}).
          merge(new_content_hash['locales'] || {})

      all_versions_content.bury('versions', current_version, stage, 'content', new_content_hash)
      all_versions_content.bury('versions', current_version, stage, 'content', 'locales', all_locales)

      create_or_update_property(SiteChrome.core_configuration_property_name, all_versions_content)
    end
  end

  # Attribute fields of Configuration as surfaced by core.
  ATTRIBUTE_NAMES = %w(id name default domainCName type updatedAt properties childCount)

  ATTRIBUTE_NAMES.each(&method(:attr_accessor))

  # For authenticating with and talking to core
  # cookies is a string e.g., "cookie_name=cookie_value;other_cookie=other_value"
  attr_accessor :cookies, :errors, :request_id

  def initialize(attributes = nil)
    @cookies = nil # Remember to set you cookies if you want to do any posting/putting!
    clear_errors
    initial_attributes = SiteChrome.default_values
    initial_attributes.merge!(attributes) if attributes
    assign_attributes(initial_attributes)
  end

  class << self

    def default_values
      {
        name: 'Site Chrome',
        default: true,
        domainCName: CurrentDomain.cname,
        type: SiteChrome.core_configuration_type,
        properties: [] # separate db records, must be created later
      }
    end

    def create_site_chrome_config(cookies)
      begin
        site_chrome = SiteChrome.new
        site_chrome.cookies = cookies
        site_chrome.create
      rescue => e
        error_message = "Error creating Site Chrome configuration. Exception: #{e.inspect}"
        site_chrome.errors << error_message if site_chrome.present?
        Rails.logger.error(error_message)
        Airbrake.notify(:error_class => 'SiteChrome', :error_message => error_message)
      end
      site_chrome
    end

    def latest_version
      SocrataSiteChrome::SiteChrome::LATEST_VERSION
    end

    def core_configurations_path
      "#{CORESERVICE_URI}/configurations"
    end

    def core_configuration_type
      'site_chrome' # or SiteChrome.name.underscore
    end

    # I live in properties[] where properties[x]['name'] ==
    def core_configuration_property_name
      'siteChromeConfigVars'
    end

    def default_request_headers
      {
        'Content-Type' => 'application/json', # this is necessary despite format :json above
        'X-Socrata-Host' => CurrentDomain.cname
      }
    end

    # Get default config from Site Chrome engine method `default_site_chrome_config`
    # and select only the latest version of the default data.
    def default_site_chrome_config
      SocrataSiteChrome::SiteChrome.default_site_chrome_config.tap do |config|
        config.dig('value', 'versions').select! do |version_number, content|
          version_number == SiteChrome.latest_version
        end
      end
    end

    def core_query_options
      {
        :query => { :type => core_configuration_type, :defaultOnly => true },
        :headers => default_request_headers
      }
    end

    # Site Chrome config as it currently exists in Core
    def site_chrome_config
      res = get(core_configurations_path, core_query_options) rescue OpenStruct.new(:body => '[]', :code => 200)
      if res.code == 200
        JSON.parse(res.body.to_s).to_a.detect { |obj| obj['default'] }
      end
    end

    def site_chrome_config_exists?
      site_chrome_config.present?
    end

    def site_chrome_property_exists?(property_name)
      return false unless site_chrome_config_exists?

      site_chrome_config['properties'].to_a.detect { |config| config['name'] == property_name }.present?
    end

    # Find existing site_chrome DomainConfig from the Site Chrome gem, and instantiate a new instance from it.
    def find
      new(SocrataSiteChrome::DomainConfig.new(CurrentDomain.cname).config)
    end

  end # end of << self methods

  def properties_path
    "#{SiteChrome.core_configurations_path}/#{id}/properties"
  end

  def clear_errors
    @errors = []
  end

  def attributes
    ATTRIBUTE_NAMES.each_with_object({}) do |field, hash|
      hash[field] = instance_variable_get("@#{field}")
    end
  end

  def assign_attributes(attributes)
    attributes.each do |key, value|
      next unless ATTRIBUTE_NAMES.include?(key.to_s)
      instance_variable_set("@#{key}", value)
    end
  end

  def property(property_name)
    properties.find { |key, _| key['name'] == property_name.to_s }
  end

  def config
    config_content = property(SiteChrome.core_configuration_property_name)
    config_content.try(:dig, 'value').present? ?
      config_content : SiteChrome.default_site_chrome_config
  end

  def current_version
    if config.try(:dig, 'value', 'versions').present?
      config.dig('value', 'current_version') || latest_published_version
    else
      # No existing data, use latest version
      SiteChrome.latest_version
    end
  end

  def latest_published_version
    config.dig('value', 'versions').keys.map { |version| Gem::Version.new(version) }.max.to_s
  end

  def published
    config.try(:dig, 'value', 'versions', '0.3', 'published')
  end

  # TODO! Do away with the OTHER activation_state inside the siteChromeConfigVars property value,
  # and just use this separate property to handle the entire activation_state.
  # It will require migrating the old activation_state values over to the separate property.
  def self.custom_content_activation_state_property_name
    'activation_state'
  end

  def authorized_request_headers
    SiteChrome.default_request_headers.merge('Cookie' => @cookies)
  end

  def create_or_update_property(property_name, property_value)
    if SiteChrome.site_chrome_property_exists?(property_name)
      update_property(property_name, property_value)
    else
      create_property(property_name, property_value)
    end
  end

  # Step 1: create a site theme configuration
  def create
    response = begin
      SiteChrome.post(
        SiteChrome.core_configurations_path,
        headers: authorized_request_headers,
        body: attributes.to_json
      )
    rescue => e
      error_mesage = "Failed to create SiteChrome. Exception: #{e.inspect}"
      Rails.logger.error(error_message)
      Airbrake.notify(:error_class => 'SiteChrome', :error_message => error_message)
    end

    handle_configuration_response(response) if response.present?
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

  def update_content(publication_stage, new_content_hash)
    meth = :"update_#{publication_stage}_content"
    if respond_to?(meth)
      send(meth, new_content_hash)
    else
      @errors << "Publication Stage #{publication_stage} unknown."
    end
  end

  def activation_state
    config.dig('value', 'activation_state').to_h
  end

  def is_activated_on?(section)
    !!activation_state[section]
  end

  # Returns an object representing the pages that have site chrome activated based on the state param.
  # In this context "open_data" is a better name for "old pages". Things like /browse, /admin, /profile.
  def set_activation_state(state)
    new_activation_state = if state['entire_site']
      { 'open_data' => true, 'homepage' => true, 'data_lens' => true }
    elsif state['all_pages_except_home']
      { 'open_data' => true, 'homepage' => false, 'data_lens' => true }
    elsif state['revert_site_chrome']
      { 'open_data' => false, 'homepage' => false, 'data_lens' => false }
    end

    all_versions_content = config.dig('value') || { 'versions' => {} }
    all_versions_content['activation_state'] = new_activation_state
    create_or_update_property(SiteChrome.core_configuration_property_name, all_versions_content)
  end

  # If activation_state exists in the config, we know that it has been set by a user.
  # This means it could have been activated and reverted, but it is still considered "activated".
  def activated?
    activation_state.present?
  end

  def on_entire_site?
    activation_state.values.all?
  end

  def on_all_pages_except_home_page?
    activation_state['open_data'] &&
      activation_state['data_lens'] &&
      !activation_state['homepage']
  end

  # EN-11700: Enable site chrome on dataslate pages if it's activated on any page,
  # and the feature flag isn't explicitly set to disable site chrome on dataslate pages
  def enabled_on_dataslate?(request)
    activation_state.values.any? &&
      !FeatureFlags.derive(nil, request).disable_site_chrome_header_footer_on_dataslate_pages
  end

  # If the site chrome header/footer is enabled on ANY page, then we activate the Dataset Landing Page
  def dslp_enabled?
    activation_state.values.any?
  end

  # True only if it has been activated and then reverted
  def reverted?
    activation_state.present? && activation_state.values.none?
  end

  def custom_content_activated?
    property(SiteChrome.custom_content_activation_state_property_name).try(:dig, :value, :custom)
  end

  private

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
