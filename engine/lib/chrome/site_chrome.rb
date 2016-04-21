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

    def header
      @content[:header]
    end

    def footer
      @content[:footer]
    end

    def general
      @content[:general]
    end

    def locales
      @content[:locales]
    end

    def styles
      {
        general: general[:styles],
        header: header[:styles],
        footer: footer[:styles]
      }
    end

    # Note: If in development you are getting 403 unauthorized, you may have to log in to Frontend
    # to get a _core_session_id. Then add that cookie to your web page for the Site Chrome app.
    # Enter in the browser console: `document.cookie="_core_session_id=xxxxxx"`
    def current_user(request)
      url = localhost?(request.host) ?
        'http://localhost:8080/users.json?method=getCurrent' : '/api/users.json?method=getCurrent'
      cookies = request.headers['Cookie'].to_s
      begin
        response = HTTParty.get(url, :headers => { 'Cookie' => cookies })
        if response.code == 200 && response.body
          JSON.parse(response.body)
        end
      end
    end

    # TODO - this method is one way the gem could handle rendering the HTML
    # def get_html(section_content)
    #   # Returns template with content hash passed in as variables
    #   # eg: template = File.read("app/views/site_chrome/header.html.erb")
    #   ERB.new(template).result(OpenStruct.new(section_content).instance_eval { binding })
    # end

    private

    def localhost?(host = nil)
      %w(local.dev localhost).include?(host) || !!ENV['LOCALHOST'].to_s.downcase == 'true'
    end
  end
end
