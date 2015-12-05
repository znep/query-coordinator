class Theme
  include ActiveModel::Conversion
  extend ActiveModel::Naming

  attr_reader :id, :title, :description, :css_variables, :updated_at, :domain_cname, :errors

  def initialize(config_hash = {})
    @id = config_hash['id']
    @title = config_hash['title']
    @description = config_hash['description']
    @css_variables = config_hash['css_variables'] || {}
    @updated_at = config_hash['updated_at'] || 0
    @domain_cname = config_hash['domain_cname']
    @persisted = config_hash['persisted'] || false
    @errors = nil
  end

  def class_name
    @class_name ||= "custom-#{id}"
  end

  def for_theme_list_config
    {
      'description' => description,
      'id' => class_name,
      'title' => title
    }
  end

  def save(headers)
    result = CoreServer.create_or_update_configuration(id, headers, to_core_config)

    if result['error'].present?
      @errors = result['message']
    else
      @id = result['id']
      @updated_at = result['updatedAt']
      @persisted = true
    end
    @persisted
  end

  def update_attributes(attributes, headers)
    @title = attributes['title']
    @description = attributes['description']
    @css_variables = attributes['css_variables']

    save(headers)
  end

  def destroy(headers)
    CoreServer.delete_configuration(id, headers)
  end

  def persisted?
    !!@persisted
  end

  def self.find(id)
    # No headers needed for configurations 'get' - it's public!
    core_config = CoreServer.get_configuration(id)
    raise "Could not find theme configuration with id, #{id}." if core_config.blank?
    self.from_core_config(core_config)
  end

  # Reads from a core configuration that looks like the following:
  #
  # {
  #   "default": true,
  #   "domainCName": "bobloblawslawblog.com",
  #   "id": 234,
  #   "name": "Story Theme 1",
  #   "updatedAt": 1389226069,
  #   "properties": [
  #     {
  #       "name": "title",
  #       "value": "Drab"
  #     },
  #     {
  #       "name": "description",
  #       "value": "Drab Theme"
  #     },
  #     {
  #       "name": "css_variables",
  #       "value": {
  #         "$medium": "768px",
  #         "$large": "1200px",
  #         "$xlarge": "1400px",
  #         "$xxlarge": "1600px"
  #       }
  #     }
  #   ],
  #   "type": "story_theme"
  # }
  def self.from_core_config(core_config)
    return unless core_config.has_key?('properties')

    properties = core_config['properties'].inject({}) do |hash, property|
      hash[property['name']] = property['value']
      hash
    end
    properties['id'] = core_config['id']
    properties['updated_at'] = core_config['updatedAt']
    properties['domain_cname'] = core_config['domainCName']
    properties['persisted'] = true

    Theme.new(properties)
  end

  def self.all_custom_for_current_domain
    (CoreServer.story_themes || []).map do |theme_config|
      self.from_core_config(theme_config)
    end.compact
  end

  # We are using these defaults in the theme admin form. They are used to whitelist
  # variables when saving as well. When adding fields to the form, make sure to add
  # a default to this list as well.
  def self.defaults
    {
      '$base-type-size' => '1em',
      '$base-line-height' => '1.54',
      '$std-type-size' => '1.1em',
      '$std-line-height' => '1.44',
      '$lg-type-size' => '1.18em',
      '$lg-line-height' => '1.54',
      '$heading-font-stack' => 'Helvetica, serif',
      '$body-font-stack' => 'Georgia, sans-serif',
      '$heading-type-color' => '#333',
      '$default-type-color' => '#252525',
      '$link-color' => '#0000ff',
      '$link-text-decoration' => 'underline',
      '$link-hover' => '#0000c2',
      '$blockquote-font-style' => 'italic',
      '$blockquote-border-left' => '2px solid #ccc',
      '$blockquote-padding-left' => '1rem',
      '$blockquote-margin-left' => '1.3rem',
      '$list-padding-left' => '2.1em',
      '$ul-list-style-type' => 'disc',
      '$ol-list-style-type' => 'decimal',
      '$hr-border-top' => '1px solid #ccc'
    }
  end

  private

  def to_core_config
    theme_hash = {
      'domainCname' => domain_cname,
      'name' => "Custom Story Theme - #{title}",
      'type' => 'story_theme',
      'properties' => [
        {
          'name' => 'title',
          'value' => title
        },
        {
          'name' => 'description',
          'value' => description
        },
        {
          'name' => 'css_variables',
          'value' => css_variables
        }
      ]
    }

    theme_hash['id'] = id unless id.blank?
    theme_hash['updatedAt'] = updated_at unless updated_at.blank?

    theme_hash
  end
end
