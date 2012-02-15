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
    prerendered_fragment_for(output_buffer, name, prerendered_content, options, &block)
  end

# FRAGMENT HELPERS

  # provide a key if you have a snippet in multiple locations of code
  # (eg :fb_js_sdk, the facebook js library); otherwise don't worry about it
  def allow_once(key = nil, &block)
    return unless block_given?
    @_allowed_blocks = [] unless defined? @_allowed_blocks

    signature = key || block.source_location.join(':')
    return if @_allowed_blocks.include? signature
    @_allowed_blocks << signature
    block.call
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
    end.join("\n").html_safe
  end

  # Returns the meta keyword tags for this view that we'll use in headers
  @@default_meta_tags = ["public", "data", "statistics", "dataset"]
  def meta_keywords(view)
    view.nil? ? nil : (view.tags.nil? ? @@default_meta_tags : view.tags + @@default_meta_tags).sort_by {rand}
  end

# js
  def jquery_include
    if Rails.env.development?
      return ('<script src="/javascripts/jquery-1.7.1.js" type="text/javascript" ' +
        'charset="utf-8"></script>').html_safe
    else
      str = <<-EOS
        <script type="text/javascript">
          document.write([
            "\\<script src='",
            "//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js'",
            " type='text/javascript'>\\<\\/script>"
          ].join(''));
        </script>
      EOS
      str.html_safe
    end
  end

  def javascript_error_helper_tag
    return ('<script type="text/javascript">blistEnv = "' + Rails.env +
      '";</script>').html_safe + include_javascripts('errors')
  end

  def current_user_js
    serialized_user = safe_json(current_user) if current_user
    return render :partial => 'shared/current_user', :locals => { :current_user => current_user, :serialized_user => serialized_user }
  end

  def needs_view_js(uid, view)
    (@view_cache ||= {})[uid] ||= view
  end

  def render_view_js
    return unless defined? @view_cache
    content_tag :script, :type => 'text/javascript' do
      # no really, the html is safe
      ([ "blist.viewCache = {};".html_safe ] +
        @view_cache.map{ |uid, view| "blist.viewCache['#{uid}'] = #{(view.is_a? View) ? (safe_json view).html_safe : view};".html_safe}).join("\n").html_safe
    end
  end

  DEFAULT_TRANSLATIONS = [ LocalePart.core ]
  def needs_translation(part)
    (@required_translation_parts ||= Set.new(DEFAULT_TRANSLATIONS)) << part
  end

  def render_translations
    content_tag :div, :id => 'translations', :'data-locale' => I18n.locale do
      LocaleCache.render_translations(@required_translation_parts || DEFAULT_TRANSLATIONS).to_json
    end
  end

# styles
  def rendered_stylesheet_tag(stylesheet, media='all')
    if Rails.env == 'development'
      return STYLE_PACKAGES[stylesheet.to_s].
        map{ |req| "<link type=\"text/css\" rel=\"stylesheet\" media=\"#{media}\"" +
                   " href=\"/styles/individual/#{req}.css\"/>" }.
        join("\n").html_safe
    else
      return ("<link type=\"text/css\" rel=\"stylesheet\" media=\"#{media}\"" +
             " href=\"/styles/merged/#{stylesheet.to_s}.css?" +
             "#{REVISION_NUMBER}.#{CurrentDomain.default_config_id}\"/>").html_safe
    end
  end

  def stylesheet_assets
    sheet_map = {}
    STYLE_PACKAGES.each do |name, sheets|
      sheet_map[name] = Rails.env == 'development' ? sheets.map { |req| "/styles/individual/#{req}.css" } :
        "/styles/merged/#{name.to_s}.css?#{REVISION_NUMBER}.#{CurrentDomain.default_config_id}"
    end
    sheet_map
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
  FLASH_MESSAGE_TYPES = [:error, :warning, :notice]
  def display_standard_flashes
    flash_obj = flash
    if request.cookies['js_flash']
      begin
        js_flash = JSON.parse(request.cookies['js_flash']).symbolize_keys
        flash_obj = flash.clone
        FLASH_MESSAGE_TYPES.each do |type|
          flash_obj[type] = h(js_flash[type]) if js_flash[type]
        end
      rescue
        # Somebody did something weird
      end
      cookies.delete 'js_flash'
    end
    flash_to_display, level = nil, nil
    FLASH_MESSAGE_TYPES.each do |type|
      if flash_obj[type]
        flash_to_display, level = flash_obj[type], type.to_s
        break
      end
    end
    content_tag 'div', flash_to_display, :class => "flash #{level}"
  end

# DATE HELPERS

  def blist_date(time, no_html = false)
    r = nil
    if time && time != 0
      r = no_html ? '' :
        '<span class="dateReplace" data-dateFormat="date" data-rawDateTime="' + time.to_s + '">'
      r += Time.at(time).strftime("%b %d, %Y")
      r += '</span>' if !no_html
    end
    return r.html_safe
  end

  def blist_date_time(time, no_html = false)
    r = nil
    if time && time != 0
      r = no_html ? '' :
        '<span class="dateReplace" data-dateFormat="date_time" data-rawDateTime="' + time.to_s + '">'
      r += Time.at(time).strftime("%b %d, %Y %I:%M%P")
      r += '</span>' if !no_html
    end
    return r.html_safe
  end

  def blist_long_date(time, no_html = false)
    r = nil
    if time && time != 0
      r = no_html ? '' :
        '<span class="dateReplace" data-dateFormat="long_date" data-rawDateTime="' + time.to_s + '">'
      r += Time.at(time).strftime("%B %d, %Y")
      r += '</span>' if !no_html
    end
    return r.html_safe
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
                        navigation_link_class = '', page_param = 'page')
    num_pages = (total_count.to_f / page_count).ceil
    base_href.sub!(Regexp.new('([?&])' + page_param + '=[0-9]*'), '\1')
    base_href = (base_href.include?("?") || base_href.include?("#")) ?
      "#{base_href}&#{page_param}=" : "#{base_href}?#{page_param}="
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
    out.html_safe
  end

  def link_to_url(url, *args)
      return link_to url, url, *args
  end

  def link_to_rpx(name, return_url = rpx_return_login_url, html_options = {})
    options = {:class => 'rpxnow', :onclick => 'return false;'}.merge(html_options)
    link_to name, "#{APP_CONFIG['rpx_signin_url']}?token_url=#{return_url}", options
  end

  def extent_html(nwLat, nwLong, seLat, seLong)
    # Repeating the first point is intentional.
    path_data = [
        [nwLat, nwLong].join(','),
        [nwLat, seLong].join(','),
        [seLat, seLong].join(','),
        [seLat, nwLong].join(','),
        [nwLat, nwLong].join(',')
    ].join('%7C')

    textual_extent = "Northwest: (#{nwLat}, #{nwLong}); " +
      "Southeast: (#{seLat}, #{seLong})"

    ("<img src='https://maps.google.com/maps/api/staticmap?path=" +
      "color:black%7Cweight:3%7Cfillcolor:0xFFFF0033%7C#{path_data}" +
      "&size=512x512&sensor=false' width='100%' title='#{textual_extent}' " +
      "alt='#{textual_extent}' />").html_safe
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
    text = text.html_safe if options[:safe] == true
    options = options.except(:text, :ifModuleEnabled, :safe,
                             'text','ifModuleEnabled','safe')
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

    return tmpl.html_safe
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
    tracking_params = { :cur => ::SecureRandom.base64(9).slice(0..10).gsub(/\//, '-').gsub(/\+/, '_') }
    tracking_params[:from] = from_tracking_id unless from_tracking_id.blank?

    root_path = request.protocol + request.host_with_port
    embed_template =  "<div>"
    if options[:show_title]
      embed_template += "<p style=\"margin-bottom:3px\"><a href=\"#{h(root_path + view.href)}\" " +
                        "target=\"_blank\" style=\"font-size:12px;font-weight:bold;" +
                        "text-decoration:none;color:#333333;font-family:arial;\">" +
                        "#{h(view.name)}</a></p>"
    end
    embed_template += "<iframe width=\"#{h options[:dimensions][:width]}px\" " +
                      "title=\"#{h view.name}\" " +
                      "height=\"#{h options[:dimensions][:height]}px\" src=\"#{h root_path}" +
                      "/w/#{h view.id}/#{variation.blank? ? 'default' : h(variation)}?" +
                      "#{tracking_params.to_param}\" frameborder=\"0\" scrolling=\"" +
                      "#{!view.display.can_publish? || view.display.scrolls_inline? ? 'no' : 'auto'}\">" +
                      "<a href=\"#{h(root_path + view.href)}\" title=\"#{h(view.name)}\" " +
                      "target=\"_blank\">#{h(view.name)}</a></iframe>"
    if options[:show_powered_by]
      embed_template += "<p><a href=\"http://www.socrata.com/\" target=\"_blank\">" +
        "Powered by Socrata</a></p>"
    end
    (embed_template + "</div>").html_safe
  end

  def render_browse(options)
    render :partial => 'datasets/browse', :locals => { :opts => options }
  end

  def safe_json(obj)
    ('JSON.parse($.htmlUnescape("' + h(obj.to_json.gsub(/\\/, '\\\\\\')) + '"))').html_safe
  end
end
