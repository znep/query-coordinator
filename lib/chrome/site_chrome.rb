module Chrome
  class SiteChrome
    attr_reader :id, :styles, :content, :updated_at, :domain_cname

    def initialize(config = {})
      @id = config['id']
      @styles = config['styles'] || {}
      @content = config['content'] || {}
      @updated_at = config['updated_at'] || 0
      @domain_cname = config['domain_cname']
    end

    def header_html
      # TODO
    end

    def footer_html
      # TODO
    end

    def navbar_html
      # TODO
    end

    # Reads from a core config that looks like the following:
    # {
    #   "default": true,
    #   "domainCName": "bobloblawslawblog.com",
    #   "id": 345,
    #   "name": "Site Chrome",
    #   "type": "site_chrome",
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
    #   ]
    # }
    def self.init_from_core_config(core_config)
      return if core_config.nil?

      properties = {}

      if core_config.has_key?('properties')
        site_chrome_config_vars = core_config['properties'].detect do |config|
          config['name'] == 'siteChromeConfigVars'
        end
        properties['styles'] = site_chrome_config_vars['value']['styles']
        properties['content'] = site_chrome_config_vars['value']['content']
      end

      properties['id'] = core_config['id']
      properties['updated_at'] = core_config['updatedAt']
      properties['domain_cname'] = core_config['domainCName']

      SiteChrome.new(properties)
    end
  end
end
