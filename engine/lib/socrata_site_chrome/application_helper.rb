require 'request_store'

module SocrataSiteChrome
  module ApplicationHelper
    def header_title
      localized('header.site_name', get_site_chrome.locales)
    end

    def footer_title
      localized('footer.site_name', get_site_chrome.locales)
    end

    def logo(img)
      img_src = img.dig('logo', 'src')
      if img_src.present?
        image_tag(img_src, :alt => img.dig('logo', 'alt') || header_title,
          :onerror => 'this.style.display="none"')
      end
    end

    def header_logo
      link_to('/', class: 'logo') do
        img = logo(get_site_chrome.header)
        span = content_tag(:span, header_title, :class => 'site-name')
        img.present? ? img << span : span
      end
    end

    def logged_in?
      request_current_user.present?
    end

    def username
      (request_current_user && request_current_user['displayName'].present?) ? request_current_user['displayName'] : 'Profile'
    end

    def current_user_is_admin?
      return false if request_current_user.nil?
      return true if request_current_user.try(:is_admin?)
      return true if request_current_user['flags'].try(:include?, 'admin')
      return true if request_current_user['roleName'] == 'administrator'
    end

    def copyright
      copy_with_year = "\u00A9 #{Time.now.year}"
      footer_title ? "#{copy_with_year}, #{footer_title}" : copy_with_year
    end

    def show_copyright?
      get_site_chrome.footer[:copyright_notice] == 'true'
    end

    def social_link_icon(type)
      {
        'facebook' => 'facebook',
        'twitter' => 'twitterbird',
        'youtube' => 'youtube',
        'linked_in' => 'linkedin',
        'flickr' => 'flickr',
        'instagram' => 'instagram',
        'tumblr' => 'tumblr',
        'yammer' => 'y', # Doesn't exist for yammer. Just show a "y" because y not
        'google_plus' => 'googleplus',
        'vimeo' => 'vimeo'
      }[type.to_s.downcase]
    end

    def valid_social_links(links)
      links.to_a.select do |link|
        link && link[:url].present?
      end
    end

    def valid_links(links)
      links.to_a.select do |link|
        link && link[:url].present? && link[:key].present?
      end
    end

    def dropdown(prompt, dropdown_options = [], orientation = 'bottom')
      dropdown_options = dropdown_options.compact.map { |option| content_tag :li, option }
      div_options = {
        'data-dropdown' => '',
        'data-orientation' => 'bottom',
        'class' => 'dropdown'
      }
      content_tag(:div, div_options) do
        div_content = content_tag(:span, prompt)
        div_content << content_tag(:ul, 'class' => 'dropdown-options') do
          safe_join(dropdown_options)
        end
      end
    end

    def localized(locale_key, locales)
      # TODO - actually handle different locales
      locales['en'].dig(*locale_key.split('.'))
    end

    def get_site_chrome
      RequestStore.store[:site_chrome] ||=
        SocrataSiteChrome::SiteChrome.new(SocrataSiteChrome::DomainConfig.new(request.host).site_chrome_config)
    end

    def request_current_user
      RequestStore.store[:current_user]
    end

    # Returns template name - either 'default' or 'rally'
    # Users can override with query parameter `?site_chrome_template=rally`
    def current_template
      template = (request.try(:query_parameters).dig(:site_chrome_template) ||
        get_site_chrome.general[:template]).to_s.strip.downcase
      case template
      when 'rally'
        'rally'
      else
        'default'
      end
    end
  end
end
