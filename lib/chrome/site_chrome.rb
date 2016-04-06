require 'erb'
require 'ostruct'

module Chrome
  class SiteChrome
    attr_reader :id, :content, :updated_at, :domain_cname

    def initialize(config = {})
      @id = config[:id]
      @content = config[:content] || {}
      @updated_at = config[:updated_at] || 0
      @domain_cname = config[:domain_cname]
    end

    def get_content(section)
      valid_section_name?(section)
      content = @content[section]
      # Add general content and locales inside section-specific content hash
      content['general'] = @content['general']
      content['locales'] = @content['locales']

      if section == 'header'
        content['navigation'] = @content['navigation']
      end

      content
    end

    # TODO - this method is a way the gem could handle rendering the HTML
    # def get_html(section)
    #   content = get_content(section)
    #   # Returns template with content hash passed in as variables
    #   template = File.read("app/views/chrome/#{section}.html.erb")
    #   ERB.new(template).result(OpenStruct.new(content).instance_eval { binding })
    # end

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

    def valid_section_name?(section_name)
      raise 'Must provide a section name to render' if section_name.nil?
      raise 'Invalid section name. Must be one of "header", "navigation", or "footer"' unless
        %w(header navigation footer).include?(section_name)
    end
  end
end
