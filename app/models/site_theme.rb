require 'httparty'

# SiteTheme is the styled header/footer settings available from configurations.json?type=site_theme
#
# WARN: Due to OpenStruct, instead of undefined symbols throwing NameError, they will return nil
# TODO: If we really finalize the site-theme data structure, use actual attributes
class SiteTheme < OpenStruct
  include HTTParty
  base_uri CORESERVICE_URI.to_s
  format :json

  # For talking to core
  attr_accessor :request_id, :cookies

  # Q: do I ever get used?
  def errors
    @errors ||= []
  end

  # maybe not needed
  def self.model_name
    class_name.underscore
  end

  def self.core_path
    '/configurations'
  end

  def self.core_type
    'site_theme'
  end

  def self.find(*args)
    raise 'not implemented!! SiteTheme is not an AR model'
  end

  def self.all
    options = { query: { type: core_type }, timeout: 5 }
    res = get(core_path, options)
    res.map { |site_theme| new(site_theme) }
  end

  def self.find_one(id)
    path = "#{core_path}/#{id}"
    res = get(path, timeout: 5)
    new(res) if res.success? && res['type'] == core_type
  end

  # This takes a hash of key-value pairs and updates the array of properties accordingly
  # I know, it's a little wierd. Honestly, I'd prefer to change the site_theme data structure
  # because a straight up hash is the natural way to express these options.
  def update_properties(new_properties)
    current_properties = (properties || []).each_with_object({}) do |prop, acc|
      acc[prop['name']] = prop['value']
    end

    self.properties =
      current_properties.
      merge(new_properties).
      map { |key, value| { 'name' => key, 'value' => value } }

    save
  end

  # First implement full save, then see about updating in parts
  def save
    false # unimplemented
  end
end
