# Methods added to this helper will be available to all templates in the application.
module ApplicationHelper

# MODULES/FEATURES
  def module_available(name_or_set, &block)
    concat(capture(&block)) if CurrentDomain.module_available?(name_or_set)
  end

  def module_available?(name_or_set)
    CurrentDomain.module_available?(name_or_set)
  end

  def module_enabled(name_or_set, &block)
    concat(capture(&block)) if CurrentDomain.module_enabled?(name_or_set)
  end

  def module_enabled?(name_or_set)
    CurrentDomain.module_enabled?(name_or_set)
  end

  def feature(name_or_set, &block)
    concat(capture(&block)) if CurrentDomain.feature?(name_or_set)
  end

  def feature?(name_or_set)
    CurrentDomain.feature?(name_or_set)
  end

# CACHE HELPERS

  def cache_key(prefix, state)
    prefix + '_' + state.sort.map {|v| CGI.escape(v[0]) + '=' +
      CGI.escape(v[1].to_s)}.join('&')
  end

  def prerendered_cache(name = {}, prerendered_content = nil, options = nil, &block)
    @controller.prerendered_fragment_for(output_buffer, name, prerendered_content, options, &block)
  end

# PAGE-HEADER

# meta
  def meta_tags(meta)
    meta.reject!{|k,v| v.blank?}
    meta.map do |key, value|
      if value.is_a? Array
        value = value.join(',')
      end
      # If the key is namespaced, assume XHTML+RDFa
      qualifier = key.to_s.match(/^.+\:.+/) ? 'property' : 'name'
      %Q[<meta #{qualifier}="#{key.to_s}" content="#{escape_once(value)}" />]
    end.join("\n")
  end

  # Returns the meta keyword tags for this view that we'll use in headers
  @@default_meta_tags = ["public", "data", "statistics", "dataset"]
  def meta_keywords(view)
    view.nil? ? nil : (view.tags.nil? ? @@default_meta_tags : view.tags + @@default_meta_tags).sort_by {rand}
  end

# js
  def jquery_include
    if Rails.env != 'production'
      return '<script src="/javascripts/jquery-1.4.4.js" type="text/javascript" ' +
        'charset="utf-8"></script>'
    else
      return <<-EOS
        <script type="text/javascript">
          document.write([
            "\\<script src='",
            ("https:" == document.location.protocol) ? "https://" : "http://",
            "ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js'",
            " type='text/javascript'>\\<\\/script>"
          ].join(''));
        </script>
      EOS
    end
  end

  def javascript_error_helper_tag
    return '<script type="text/javascript">blistEnv = "' + Rails.env +
      '";</script>' + javascript_include_tag('util/errors')
  end

# styles
  def rendered_stylesheet_tag(stylesheet)
    if Rails.env == 'development'
      return STYLE_PACKAGES[stylesheet.to_s].
        map{ |req| "<link type=\"text/css\" rel=\"stylesheet\" media=\"screen\"" +
                   " href=\"/styles/individual/#{req}.css\"/>" }.
        join("\n")
    else
      return "<link type=\"text/css\" rel=\"stylesheet\" media=\"screen\"" +
             " href=\"/styles/merged/#{stylesheet.to_s}.css?" +
             "#{REVISION_NUMBER}.#{CurrentDomain.default_config_id}\"/>"
    end
  end

# TOP OF PAGE

  # Display a standardized flash error message.
  # To use this, simply set flash[:notice], flash[:warning], or flash[:error]
  # in your controller, then add <%= display_standard_flashes %> in your view
  # template. It will automagically display the most severe flash message
  # available - error, then warning, then notice. The result is a div like this:
  #
  # <div class="flash warning">Your error text</flash>
  #
  # Adapted from http://snippets.dzone.com/posts/show/2348
  def display_standard_flashes
    if flash[:error]
      flash_to_display, level = flash[:error], 'error'
    elsif flash[:warning]
      flash_to_display, level = flash[:warning], 'warning'
    elsif flash[:notice]
      flash_to_display, level = flash[:notice], 'notice'
    end
    content_tag 'div', flash_to_display, :class => "flash #{level}"
  end

# DATE HELPERS

  def blist_date(time)
    time && time != 0 ? Time.at(time).strftime("%b %d, %Y") : nil
  end

  def blist_long_date(time)
    time && time != 0 ? Time.at(time).strftime("%B %d, %Y") : nil
  end

  def friendly_relative_time(time_str)
    if time_str.blank?
      return ''
    end

    time_obj = Time.at(time_str)
    # Using blist & gov locales screws up this Rails function; force the en locale
    distance_of_time_in_words(time_obj, Time.now, false, {:locale => 'en'}) +
      (time_obj > Time.now ? ' from now' : ' ago')
  end

# HTML HELPERS

  def create_pagination(total_count, page_count, current_page, base_href,
                        navigation_link_class = '')
    num_pages = (total_count.to_f / page_count).ceil
    base_href.sub!(/([?&])page=[0-9]*/, '\1')
    base_href = (base_href.include?("?") || base_href.include?("#")) ?
      "#{base_href}&page=" : "#{base_href}?page="
    base_href.sub!(/&&+/, '&')

    # bail if we only have 1 page
    return '' if num_pages == 1

    # Only display 9 pages at a time.
    start_page = 1
    if (current_page - 4 > 0)
      start_page = current_page - 4
    end

    end_page = num_pages
    if (num_pages > 9 && current_page + 4 < num_pages)
      end_page = start_page > 1 ? current_page + 4 : 9
    end

    out = "<div class='pagination'>"
    if (current_page > 1)
      out += link_to("<span class='icon'>First</span>".html_safe,
                     base_href + (1).to_s,
                     :class => "start firstLink " + navigation_link_class,
                     :title => "First Page")
      out += link_to("<span class='icon'>Prev</span>".html_safe,
                     base_href + (current_page - 1).to_s,
                     :class => "previous prevLink " + navigation_link_class,
                     :title => "Previous Page")
    end
    if (start_page > 1)
      out += "<span class='ellipses'>...</span>"
    end
    (start_page..end_page).each do |i|
      page_link_class = i == current_page ? "pageLink active" : "pageLink"
      out += link_to(i, base_href + i.to_s, :class => page_link_class,
                     :title => "Page #{i}")
    end
    if (end_page < num_pages)
      out += "<span class='ellipses'>...</span>"
    end
    if (current_page < num_pages)
      out += link_to("<span class='icon'>Next</span>".html_safe,
                     base_href + (current_page + 1).to_s,
                     :class => "next nextLink " + navigation_link_class,
                     :title => "Next Page")
      out += link_to("<span class='icon'>Last</span>".html_safe,
                     base_href + (num_pages).to_s,
                     :class => "end lastLink " + navigation_link_class,
                     :title => "Last Page")
    end

    out += "</div>"
  end

  def link_to_url(url, *args)
      return link_to url, url, *args
  end

  def link_to_rpx(name, return_url = rpx_return_login_url, html_options = {})
    options = {:class => 'rpxnow', :onclick => 'return false;'}.merge(html_options)
    link_to name, "#{APP_CONFIG['rpx_signin_url']}?token_url=#{return_url}", options
  end

# THEME HELPERS

  # Simple technique to do nested layouts. If you want to include one layout
  # inside of another, in the inner layout, put the following at the bottom
  # of your layouts/foo.html.erb:
  #
  # <% parent_layout('outer') %>
  def parent_layout(layout)
    @content_for_layout = self.output_buffer
    self.output_buffer = render(:file => "layouts/#{layout}")
  end

  def link_from_theme(options)
    return unless options[:ifModuleEnabled].blank? ||
                  CurrentDomain.module_enabled?(options[:ifModuleEnabled])

    text = options[:text]
    options.delete(:text)
    options.delete(:ifModuleEnabled)
    return content_tag('a', text, options)
  end

  def theme_image_url(options)
    if options[:type].to_s == "static"
      return "#{options[:href]}"
    elsif options[:type].to_s == "hosted"
      return "/assets/#{options[:href]}"
    end
  end

  def render_domain_template(template_name, version = '2b')
    tmpl = CurrentDomain.templates(version)[template_name] || ''
    tmpl = tmpl.clone # make a copy so we don't override and we don't leave a mess for the GC

    DOMAIN_TEMPLATES.each do |subst|
      pattern = '{{' + subst + '}}'
      tmpl.gsub!(pattern, render(:partial => 'shared/template/' + subst)) if
        tmpl.include?(pattern)
    end

    tmpl.gsub!(/\{\{string\.(\w+)\}\}/) {|match| CurrentDomain.strings[$1]}

    tmpl.gsub!(/\{\{urls\.(\w+)\}\}/) do |match|
      (CurrentDomain.theme(version).urls[$1] || []).map do |url|
        '<li>' + (link_from_theme(url) || '') + '</li>' # at least fail silently rather than break everything.
      end.join('')
    end

    return tmpl
  end

# MISC 

  def get_publish_embed_code_for_view(view, options = {}, variation = "", from_tracking_id = nil)
    # merge publish options with theme options if extant
    theme = WidgetCustomization.find(variation) if variation =~ /\w{4}-\w{4}/
    if theme.nil?
      options = WidgetCustomization.merge_theme_with_default({:publish => options}, 1)[:publish]
    else
      options = theme.customization[:publish].deep_merge(options)
    end

    # generate a new tracking ID param set
    tracking_params = { :cur => ActiveSupport::SecureRandom.base64(9).slice(0..10).gsub(/\//, '-').gsub(/\+/, '_') }
    tracking_params[:from] = from_tracking_id unless from_tracking_id.blank?

    root_path = request.protocol + request.host_with_port
    embed_template =  "<div>"
    if options[:show_title]
      embed_template += "<p style=\"margin-bottom:3px\"><a href=\"#{root_path + view.href}\" " +
                        "target=\"_blank\" style=\"font-size:12px;font-weight:bold;" +
                        "text-decoration:none;color:#333333;font-family:arial;\">" +
                        "#{h(view.name)}</a></p>"
    end
    embed_template += "<iframe width=\"#{options[:dimensions][:width]}px\" " +
                      "title=\"#{view.name}\" " +
                      "height=\"#{options[:dimensions][:height]}px\" src=\"#{root_path}" +
                      "/w/#{view.id}/#{variation.blank? ? 'default' : variation}?" +
                      "#{tracking_params.to_param}\" frameborder=\"0\" scrolling=\"" +
                      "#{!view.display.can_publish? || view.display.scrolls_inline? ? 'no' : 'auto'}\">" +
                      "<a href=\"#{root_path + view.href}\" title=\"#{h(view.name)}\" " +
                      "target=\"_blank\">#{h(view.name)}</a></iframe>"
    if options[:show_powered_by]
      embed_template += "<p><a href=\"http://www.socrata.com/\" target=\"_blank\">" +
        "Powered by Socrata</a></p>"
    end
    embed_template += "</div>"
  end

  def render_browse(supress_includes = false)
    render :partial => 'datasets/browse', :locals => { :supress_includes => supress_includes }
  end

  def render_browse_includes
    render :partial => 'datasets/browse_includes'
  end

  def safe_json(obj)
    'JSON.parse($.htmlUnescape("' + h(obj.to_json.gsub(/\\/, '\\\\\\')) + '"))'
  end

  safe_helper :meta_tags, :jquery_include, :javascript_error_helper_tag, :create_pagination,
    :render_domain_template, :rendered_stylesheet_tag, :get_publish_embed_code_for_view,
    :render_browse, :safe_json
end
