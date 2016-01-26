class SiteChrome
  include ActiveModel::Conversion
  include ActiveModel::Validations
  extend ActiveModel::Naming

  attr_reader :id, :styles, :content, :updated_at, :domain_cname

  def initialize(config_hash = {})
    @id = config_hash['id']
    @styles = config_hash['styles'] || {}
    @content = config_hash['content'] || {}
    @updated_at = config_hash['updated_at'] || 0
    @domain_cname = config_hash['domain_cname']
    @persisted = config_hash['persisted'] || false
  end

  def save
    return false unless valid?

    result = CoreServer.create_or_update_configuration(id, to_core_config)

    if result['error'].present?
      errors[:base] << result['message']
      @persisted = false
    else
      @id = result['id']
      @updated_at = result['updatedAt']
      @persisted = true
    end

    @persisted
  end

  def update_attributes(attributes)
    @styles = attributes['styles']
    @content = attributes['content']
    @domain_cname = attributes['domain_cname']

    save
  end

  def destroy
    CoreServer.delete_configuration(id)
  end

  def persisted?
    !!@persisted
  end

  def self.for_current_domain
    site_chrome = self.from_core_config(CoreServer.site_chrome.first || {})

    defaults = self.default_values
    site_chrome.styles.reverse_merge!(defaults['styles'])
    site_chrome.content.reverse_merge!(defaults['content'])
    site_chrome
  end

  # Reads from a core config that looks like the following:
  # {
  #   "default": true,
  #   "domainCName": "bobloblawslawblog.com",
  #   "id": 345,
  #   "name": "Site Chrome",
  #   "properties": [
  #     {
  #       "name": "siteChromeConfigVars",
  #       "value": {
  #         "styles": {
  #           "$bg-color": "#abcdef",
  #           "$font-color": "#012345"
  #         },
  #         "content": {
  #           "logoUrl": "http://s3.bucket.com/images/001/logo.png",
  #           "logoAltText": "Bob Loblaw's Law Blog",
  #           "friendlySiteName": "Bob Loblaw's Law Blog",
  #           "link1Label": "OpenData Portal",
  #           "link1Url": "http://data.bobloblawslawblog.com/browse",
  #           "link2Label": "Budget",
  #           "link2Url": "http://budget.data.bobloblawslawblog.com",
  #           "link3Label": "Spending",
  #           "link3Url": "http://expenditures.data.bobloblawslawblog.com",
  #         }
  #       }
  #     }
  #   ],
  #   "type": "site_chrome"
  # }
  def self.from_core_config(core_config)
    return if core_config.nil?

    properties = {}

    if core_config.has_key?('properties')
      site_chrome_config_vars = core_config['properties'].detect do |config|
        config['name'] == 'siteChromeConfigVars'
      end
      properties['styles'] = site_chrome_config_vars['value']['styles']
      properties['content'] = site_chrome_config_vars['value']['content']

      properties['persisted'] = true
    end

    properties['id'] = core_config['id']
    properties['updated_at'] = core_config['updatedAt']
    properties['domain_cname'] = core_config['domainCName']

    SiteChrome.new(properties)
  end

  private

  def to_core_config
    site_chrome_hash = {
      'domainCName' => domain_cname,
      'name' => "Site Chrome",
      'type' => 'site_chrome',
      'properties' => [
        {
          'name' => 'siteChromeConfigVars',
          'value' => {
            'styles' => styles,
            'content' => content
          }
        }
      ]
    }

    site_chrome_hash['id'] = id unless id.blank?
    site_chrome_hash['updatedAt'] = updated_at unless updated_at.blank?

    site_chrome_hash
  end

  def self.default_values
    {
      'styles' => {
        '$bg-color' => '#2c97de',
        '$font-color' => '#fff'
      },
      'content' => {
        'friendlySiteName' => CoreServer.current_domain['name'],
        'link1Label' => 'OpenData Catalog',
        'link1Url' => '/browse'
      }
    }
  end

end
