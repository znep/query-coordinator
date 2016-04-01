require 'erb'
require 'ostruct'

module Chrome
  class SiteChrome
    attr_reader :id, :styles, :content, :updated_at, :domain_cname

    def initialize(config = {})
      @id = config[:id]
      @content = config[:content] || {}
      @updated_at = config[:updated_at] || 0
      @domain_cname = config[:domain_cname]
    end

    # General/universal settings in the Site Chrome config
    def general_configs
      @content['general']
    end

    # Merge general configs with section configs
    def get_configs(section)
      
    end

    def get_html(section)
      raise 'Must provide a section name to render' if section.nil?
      raise 'Invalid section name. Must be one of "header", "navigation", or "footer"' unless
        %w(header navigation footer).include?(section)

      section_content = OpenStruct.new(@content[section]) # TODO - combine general_configs into this?
      template = File.read("templates/#{section}.html.erb")
      ERB.new(template).result(section_content.instance_eval { binding })
    end

    def self.init_from_core_config(core_config)
      return if core_config.nil?

      site_chrome_config = newest_published_site_chrome(core_config)

      properties = {
        id: core_config['id'],
        content: site_chrome_config['content'],
        updated_at: site_chrome_config['updatedAt'] || core_config['updatedAt'],
        domain_cname: core_config['domainCName']
      }

      SiteChrome.new(properties)
    end

    private

    # Core config contains various versions, each having a "published" and "draft" set of
    # site chrome config vars. This finds and returns the newest published content.
    def self.newest_published_site_chrome(core_config)
      if core_config.has_key?('properties')
        site_chrome_config = core_config['properties'].detect do |config|
          config['name'] == 'siteChromeConfigVars'
        end

        latest_version = site_chrome_config['value']['versions'].keys.map(&:to_f).max.to_s
        site_chrome_config['value']['versions'][latest_version]['published']
      else
        {}
      end
    end

  end
end
