# Methods added to this helper will be available to all templates in the application.
module ApplicationHelper
  attr_reader :using_dataslate, :on_homepage

  include Browse2Helper
  include BrowseHelper
  include CommonSocrataMethods
  include UserAuthMethods
  include Socrata::UrlHelpers
  # Note: SiteChromeHelper is included automatically due to the naming coinciding with
  # SiteChromeController, but here anyways for posterity
  include SiteChromeHelper

# RAILS OVERRIDE

  # if you provide a locale of nyan, we will nyan nyan nyan nyan nyan
  def translate(key, options = {})
    if I18n.locale == :nyan
      'nyan'
    else
      super
    end
  end
  alias :t :translate

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

  # CAUTION! This method implementation differs from the method of the same name in the View class
  def module_enabled?(name_or_set)
    CurrentDomain.module_enabled?(name_or_set)
  end

  def feature(name_or_set, &block)
    concat(capture(&block)) if CurrentDomain.feature?(name_or_set)
  end

  def feature?(name_or_set)
    CurrentDomain.feature?(name_or_set)
  end

  # helper for returning a boolean feature flag
  def feature_flag?(name, request)
    !!FeatureFlags.derive(nil, request)[name]
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

# SITE CHROME (header and footer)

  # dataslate_page and homepage are passed to the view that calls this from custom_content_controller.
  # Note that the order of these checks is important. For example, if the user is on the homepage,
  # we enable site chrome only if the homepage flag is true (regardless of the other flags).
  def enable_site_chrome?
    site_chrome = SiteChrome.find
    return false unless site_chrome
    return true if in_preview_mode?

    if on_homepage
      site_chrome.is_activated_on?('homepage')
    elsif using_dataslate
      FeatureFlags.derive(nil, request).site_chrome_header_and_footer_for_dataslate
    else
      site_chrome.is_activated_on?('open_data')
    end
  end

  def in_preview_mode?
    !!cookies[:socrata_site_chrome_preview]
  end

  def on_view_page?(view = @view)
    view.try(:data).try(:[], 'id').present?
  end

  def using_govstat_header?
    module_enabled?(:govStat) && !suppress_govstat?
  end

# DATASET LANDING PAGE
  def dataset_landing_page_enabled?
    !!SiteChrome.find.try(:dslp_enabled?)
  end

# PAGE-HEADER

  def get_favicon_tag
    if enable_site_chrome?
      site_chrome_favicon_tag
    else
      favicon_link_tag(theme_image_url(CurrentDomain.theme.images.favicon))
    end
  end

  def get_site_title
    if enable_site_chrome? && site_chrome_window_title.present?
      site_chrome_window_title
    else
      CurrentDomain.strings.site_title
    end
  end

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
    ((view.tags || []) + @@default_meta_tags).sort_by { rand } if view.present?
  end

# js
  def jquery_include(version = '1.7.1')
    if Rails.env.development?
      return ("<script src=\"/javascripts/jquery-#{version}.js\" type=\"text/javascript\" " +
        'charset="utf-8"></script>').html_safe
    else
      str = <<-EOS
        <script type="text/javascript">//<![CDATA[
          document.write([
            "\\<script src='",
            "//ajax.googleapis.com/ajax/libs/jquery/#{version}/jquery.min.js'",
            " type='text/javascript'>\\<\\/script>"
          ].join(''));
        //]]></script>
      EOS
      str.html_safe
    end
  end

  def javascript_error_helper_tag
    %Q{<script type="text/javascript">blistEnv = "#{Rails.env}";</script>}.html_safe + include_javascripts('errors')
  end

  def needs_view_js(uid, view)
    (@view_cache ||= {})[uid] ||= view
  end

  def render_view_js
    return unless defined? @view_cache
    content_tag :script, :type => 'text/javascript' do
      # no really, the html is safe
      ([ "blist.viewCache = {};".html_safe ] +
        @view_cache.map do |uid, view|
          "blist.viewCache['#{uid}'] = #{(view.is_a? View) ? (safe_json view).html_safe : view};\n" +
          "if (!$.isBlank(blist.viewCache['#{uid}'].resourceName)) " +
          "{ blist.viewCache[blist.viewCache['#{uid}'].resourceName] = blist.viewCache['#{uid}']; }".html_safe
        end).join("\n").html_safe
    end
  end

  DEFAULT_TRANSLATIONS = [
    LocalePart.core,
    LocalePart.account.common,
    LocalePart.controls.common,
    LocalePart.controls.charts,
    LocalePart.plugins.jquery_ui
  ]
  def render_translations(part = nil)
    @rendered_translations ||= Set.new()
    to_render = [part].concat(DEFAULT_TRANSLATIONS)
    if module_enabled?(:govStat)
      to_render << LocalePart.govstat.chrome.header
      to_render << LocalePart.plugins
    end
    to_render = to_render.compact.reject {|t| @rendered_translations.include?(t)}
    return '' if to_render.empty?
    @rendered_translations = @rendered_translations.merge(to_render)
    content_tag :script, :type => 'text/javascript' do
      <<-EOS
        if (typeof blistTranslations == 'undefined') blistTranslations = [];
        blistTranslations.push(function()
        {
            return #{safe_json(LocaleCache.render_translations(to_render))};
        });
      EOS
        .html_safe
    end
  end

  # For altering jquery-ui's regionality because the "correct" way is dumb.
  def render_jquery_ui_translations
    content_tag :script, :type => 'text/javascript' do
      <<-EOS
      (function() {
      var months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
                    'september', 'october', 'november', 'december'],
          days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          t = function(str) { return $.t('plugins.jquery_ui.' + str); };
      $.datepicker.setDefaults({
        closeText: t('done'),
        prevText: t('prev'),
        nextText: t('next'),
        currentText: t('today'),
        monthNames: _.map(months, function(m) { return t(m); }),
        monthNamesShort: _.map(months, function(m) { return t(m + '_short'); }),
        dayNames: _.map(days, function(m) { return t(m); }),
        dayNamesShort: _.map(days, function(m) { return t(m + '_short'); }),
        dayNamesMin: _.map(days, function(m) { return t(m + '_min'); }),
        weekHeader: t('week_min')
      });
      $.DatePickerLocaleOptions = {
        days: _.map(days, function(m) { return t(m); }),
        daysShort: _.map(days, function(m) { return t(m + '_short'); }),
        daysMin: _.map(days, function(m) { return t(m + '_min'); }),
        months: _.map(months, function(m) { return t(m); }),
        monthsShort: _.map(months, function(m) { return t(m + '_short'); }),
        weekMin: t('week_min')
      };
      })();
      EOS
        .html_safe
    end
  end

# STYLES

  def should_render_individual_styles?
    Rails.env.development? && FeatureFlags.derive(@view, request).use_merged_styles != true
  end

  def rendered_stylesheet_tag(stylesheet, media='all')
    if should_render_individual_styles?
      style_package = STYLE_PACKAGES[stylesheet]
      raise "Missing style package: #{stylesheet}" unless style_package
      style_package.map do |stylesheet|
        %Q{<link type="text/css" rel="stylesheet" media="#{media}" href="/styles/individual/#{stylesheet}.css?#{asset_revision_key}"/>}
      end.join("\n").html_safe
    else
      %Q{<link type="text/css" rel="stylesheet" media="#{media}" href="/styles/merged/#{stylesheet.to_s}.css?#{asset_revision_key}"/>}.html_safe
    end
  end

  def stylesheet_assets
    sheet_map = {}
    STYLE_PACKAGES.each do |name, sheets|
      sheet_map[name] = if should_render_individual_styles?
        (sheets || []).map { |req| "/styles/individual/#{req}.css" }
      else
        "/styles/merged/#{name.to_s}.css?#{asset_revision_key}"
      end
    end
    sheet_map
  end

  def asset_revision_key
    @asset_revision_key ||= [
      get_revision,
      CurrentDomain.default_config_id,
      CurrentDomain.default_config_updated_at
    ].join('.')
  end

  def get_revision
    REVISION_NUMBER || Rails.env
  end

  def include_webpack_bundle(resource)
    if !FeatureFlags.derive(nil, request).prefer_webpack && resource =~ /open\-data/
      return include_javascripts(File.basename(resource, File.extname(resource)))
    end

    if Rails.configuration.webpack[:use_dev_server]
      src = "/javascripts/webpack/#{resource}"
    else
      # use compiled asset
      src = if Rails.configuration.webpack[:use_manifest]
        manifest = Rails.configuration.webpack[:asset_manifest]
        "build/#{manifest[resource]}"
      else
        "build/#{resource}"
      end
    end
    javascript_include_tag(src)
  end

# TOP OF PAGE

  # Display a standardized flash error message.
  # To use this, simply set flash[:notice], flash[:warning], or flash[:error]
  # in your controller, then add <%= display_standard_flashes %> in your view
  # template. It will display all the flash messages available.
  # - error, warning, notice. The result is a div like this:
  #
  # <div class="flash warning">Your error text</flash>
  #
  # Adapted from http://snippets.dzone.com/posts/show/2348
  FLASH_MESSAGE_TYPES = %i[error warning notice]
  def display_standard_flashes
    flash_obj = flash
    add_js_flash(flash_obj)

    return if flash_obj.blank?

    flash_html = flash_obj.map do |level, message|
      next unless FLASH_MESSAGE_TYPES.include?(level.to_sym)

      message = format_flash_message(message)

      content_tag('div', message, :class => "flash #{level}")
    end.join

    flash_html.html_safe
  end

  # Returns flashes with the markup the Socrata Styleguide expects to style for
  # alerts. Used on dataset landing page and hopefully other places moving forward
  def display_styleguide_flashes
    flash_obj = flash
    add_js_flash(flash_obj)

    return if flash_obj.blank?

    flash_html = flash_obj.map do |level, message|
      next unless FLASH_MESSAGE_TYPES.include?(level.to_sym)

      message = format_flash_message(message)

      alert_class = (level === 'notice') ? 'info' : level
      inner_alert = content_tag('div', message, :class => "alert-container")
      content_tag('div', inner_alert, :class => "alert styleguide-alert #{alert_class}")
    end.join

    flash_html.html_safe
  end

  # Most basic flash display. Does not support arrays or | separators
  def display_homepage_flashes
    return unless controller.class == CustomContentController && action_name == 'homepage'

    flash.map do |level, message|
      content_tag('div', message, :class => "flash #{level}")
    end.join
  end

  # Join flash arrays and convert | to <br>s
  def format_flash_message(message)
    if message.is_a?(Array)
      message = safe_join(message, tag('br'))
    end

    if message.include?('|')
      # Todo: consider replacing places we rely on | with normal <br> tags
      message = safe_join(message.split('|').map { |piece| content_tag(:span, piece.html_safe) }, tag('br'))
    end

    return message
  end

  def add_js_flash(flash_obj)
    if request.cookies['js_flash']
      begin
        js_flash = JSON.parse(request.cookies['js_flash']).symbolize_keys
        FLASH_MESSAGE_TYPES.each do |type|
          if js_flash[type]
            flash_obj[type] = h(js_flash[type])
            # EN-7186: It appears that Rails fails to properly discard flash messages that have been
            # manually added to the flash object (which we do here by copying them from the cookie).
            # This results in flash messages that are added from the cookie persisting for two page
            # loads instead of one.
            # To address this issue we will manually tell the flash object to discard the messages after
            # the current request at the same time that we add them.
            flash_obj.discard(type)
          end
        end
      rescue
        # Somebody did something weird
      end
      cookies.delete 'js_flash'
    end

    return flash_obj
  end

# DATE HELPERS

  def blist_date(time, no_html = false)
    date_span(time, 'date', '%b %d, %Y', no_html)
  end

  def blist_date_time(time, no_html = false)
    date_span(time, 'date_time', '%b %d, %Y %I:%M%P', no_html)
  end

  def blist_long_date(time, no_html = false)
    date_span(time, 'long_date', '%B %d, %Y', no_html)
  end

  def date_span(time, date_format, format_string, no_html)
    r = nil
    if time && time != 0
      r = no_html ? '' :
        "<span class=\"dateReplace\" data-dateFormat=\"#{date_format}\" data-rawDateTime=\"#{time.to_s}\">"
      r << Time.at(time).strftime(format_string)
      r << '</span>' if !no_html
    end
    return r.html_safe if r
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
      out += link_to('<span class="icon">&#9666;&#9666;</span>'.html_safe,
                     "#{base_href}1",
                     :class => "start firstLink " + navigation_link_class,
                     'aria-label' => t('core.pagination.first_page'),
                     :title => t('core.pagination.first_page'))
      out += link_to('<span class="icon">&#9666;</span>'.html_safe,
                     "#{base_href}#{current_page - 1}",
                     :class => "previous prevLink " + navigation_link_class,
                     'aria-label' => t('core.pagination.previous_page'),
                     :title => t('core.pagination.previous_page'))
    end

    if (start_page > 1)
      out += "<span class='ellipses'>...</span>"
    end

    accessible_page_text = "<span class='accessible'>#{t('core.pagination.page')}</span>"
    accessible_current_page_text = "<span class='accessible'>#{t('core.pagination.current_page')}</span>"
    accessible_page_spacer = '<span class="accessible">&nbsp;</span>'

    (start_page..end_page).each do |i|
      is_current = i == current_page
      page_link_class = is_current ? "pageLink active" : "pageLink"
      out += link_to("#{is_current ? accessible_current_page_text : accessible_page_text}#{accessible_page_spacer}#{i}#{accessible_page_spacer}".html_safe, base_href + i.to_s, :class => page_link_class,
                     :title => t('core.pagination.page') + " #{i}")
    end

    if (end_page < num_pages)
      out += "<span class='ellipses'>...</span>"
    end

    if (current_page < num_pages)
      out += link_to('<span class="icon">&#9656;</span>'.html_safe,
                     base_href + (current_page + 1).to_s,
                     :class => "next nextLink " + navigation_link_class,
                     'aria-label' => t('core.pagination.next_page'),
                     :title => t('core.pagination.next_page'))
      out += link_to('<span class="icon">&#9656;&#9656;</span>'.html_safe,
                     base_href + (num_pages).to_s,
                     :class => "end lastLink " + navigation_link_class,
                     'aria-label' => t('core.pagination.last_page'),
                     :title => t('core.pagination.last_page'))
    end

    out += "</div>"
    out.html_safe
  end

  def link_to_url(url, *args)
      return link_to url, url, *args
  end

  def link_to_rpx(name, return_url = rpx_return_login_url, html_options = {})
    options = {:class => 'rpxnow', :onclick => 'return false;'}.merge(html_options)
    link_to name, "#{APP_CONFIG.rpx_signin_url}?token_url=#{return_url}", options
  end

  def render_license
    licenseId = @view.property_or_default(['licenseId'])
    return t('screens.about.none') if licenseId.nil?

    license = ExternalConfig.for(:license).find_by_id licenseId
    license_link = license[:terms_link]
    license_logo = license[:logo]
    license_name = license[:display_name] || license[:name]

    license_logo = "/#{license_logo}" if license_logo.present? && URI(license_logo).scheme.nil?

    html = license_name
    html = %Q{<img src="#{license_logo}" alt="#{license_name}" />} if license_logo.present?
    html = %Q{<a href="#{license_link}" rel="nofollow noreferrer external">#{html}</a>} if license_link.present?
    html
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

  def modal(options, &block)
    options[:class] = ['modalDialog', (options.delete(:class) || options.delete('class'))].compact.join(' ')
    options[:style] ||= 'display:none'

    content_tag(:div, options) do
      [content_tag(:a, :href => '#close', :class => 'jqmClose modalDialogClose'){ t('core.dialogs.close') },
       capture(&block)].join.html_safe
    end
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

    text = text[I18n.locale.to_s] || '(no translation available)' if text.is_a? Hash

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
    render_text_template(CurrentDomain.templates(version, I18n.locale)[template_name] || '', version)
  end

  def render_text_template(tmpl, version = '2b')
    tmpl = tmpl.clone

    DOMAIN_TEMPLATES.each do |subst|
      pattern = '{{' + subst + '}}'
      tmpl.gsub!(pattern, render(:partial => 'shared/template/' + subst)) if
        tmpl.include?(pattern)
    end

    tmpl.gsub!(/\{\{string\.(\w+)\}\}/){ |match| CurrentDomain.strings(I18n.locale)[$1] }

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

    # set up our route generation for the iframe
    widget_params = { id: view.id, customization_id: 'default' }
    widget_params[:customization_id] = variation unless variation.blank?
    widget_params[:host] = view.domainCName if view.federated?
    widget_params.merge!(tracking_params)

    embed_template =  "<div>"
    if options[:show_title]
      embed_template << "<p style=\"margin-bottom:3px\"><a href=\"#{h(view_url(view))}\" " +
                        "target=\"_blank\" style=\"font-size:12px;font-weight:bold;" +
                        "text-decoration:none;color:#333333;font-family:arial;\">" +
                        "#{h(view.name)}</a></p>"
    end
    embed_scrolling = (view.display.can_publish? || view.display.scrolls_inline?) ? 'no' : 'auto'
    embed_template << "<iframe width=\"#{h options[:dimensions][:width]}px\" " +
                        "title=\"#{h view.name}\" " +
                        "height=\"#{h options[:dimensions][:height]}px\" " +
                        "src=\"#{h widget_url(widget_params)}\" " +
                        "frameborder=\"0\"" +
                        "scrolling=\"#{embed_scrolling}\">" +
                          "<a href=\"#{h(view_url(view))}\" title=\"#{h(view.name)}\" " +
                            "target=\"_blank\">#{h(view.name)}" +
                          "</a>" +
                      "</iframe>"
    if options[:show_powered_by]
      embed_template << "<p><a href=\"http://www.socrata.com/\" target=\"_blank\">Powered by Socrata</a></p>"
    end
    (embed_template << "</div>").html_safe
  end

  def render_browse(options)
    render :partial => 'datasets/browse', :locals => { :opts => options }
  end

  # This may be redundant with json_escape; to be determined.
  def safe_json(obj)
    ('JSON.parse($.unescapeQuotes("' + h(obj.to_json.gsub(/\\/, '\\\\\\')) + '"))').html_safe
  end

  # Patch json_escape because in Rails 3.x it will devour quotes
  # (copied from https://github.com/rails/rails/blob/master/activesupport/lib/active_support/core_ext/string/output_safety.rb)
  JSON_ESCAPE_REGEXP = /[\u2028\u2029&><]/u
  JSON_ESCAPE = { '&' => '\u0026', '>' => '\u003e', '<' => '\u003c', "\u2028" => '\u2028', "\u2029" => '\u2029' }
  def json_escape(s)
    result = s.to_s.gsub(JSON_ESCAPE_REGEXP, JSON_ESCAPE)
    s.html_safe? ? result.html_safe : result
  end

  def localized_link_to(name, options, *args, &block)
    if options.is_a?(String) && options[0] == '/' && I18n.locale.to_s != CurrentDomain.default_locale
      link_to(name, "/#{I18n.locale}#{options}", *args, &block)
    else
      link_to(name, options, *args, &block)
    end
  end

  def feature_flag_input(flag, flag_config, flag_value, options = {})
    name = "feature_flags[#{flag}]"
    name = "view[metadata[#{name}]]" if options[:edit_metadata]

    label_for = name.chop.gsub(/[\[\]]+/, '_')

    other_selected = [String, Array, Fixnum].include?(flag_value.class)

    html = []
    unless flag_config['disableTrueFalse']
      html << radio_button_tag(name, true, flag_value === true, :disabled => options[:disabled])
      html << label_tag("#{label_for}_true", 'true')
      html << radio_button_tag(name, false, flag_value === false, :disabled => options[:disabled])
      html << label_tag("#{label_for}_false", 'false')
      html << radio_button_tag(name, nil, other_selected, :class => 'other', :disabled => options[:disabled])
      html << label_tag(label_for, 'Other:')
    end
    if flag_config.expectedValues?
      html << select_tag(
                name,
                options_for_select(flag_config.expectedValues.split(' ').
                  reject { |value| ['true', 'false'].include? value }, flag_value),
                :disabled => options[:disabled])
    else
      case flag_value
      when String, Fixnum
        html << text_field_tag(name, flag_value, :disabled => options[:disabled])
      when Array
        html << text_field_tag(name, flag_value.to_json, :disabled => options[:disabled])
      else
        html << text_field_tag(name, nil, :disabled => options[:disabled])
      end
    end

    html.join(' ').html_safe
  end

  def suppress_govstat?
    @suppress_govstat || !CurrentDomain.member?(current_user)
  end

  def is_mobile?
    param_mobile = params[:mobile].to_s
    param_no_mobile = params[:no_mobile].to_s

    # If "no_mobile=true" or "mobile=false" is on the URL, don't add the viewport meta tag
    return false if param_no_mobile.match(/true/i) || param_mobile.match(/false/i)

    # If "mobile=true" or "no_mobile=false" is on the URL, force the addition of the viewport meta tag
    return true if param_mobile.match(/true/i) || param_no_mobile.match(/false/i)

    # The regular expression below is not all inclusive.
    !!request.env['HTTP_USER_AGENT'].to_s.match(/(iPhone|iPod|iPad|Android|Windows Phone|BlackBerry)/i)
  end

  # Returns true unless the enable_standard_ga_tracking feature flag is set to false or the
  # opendata_ga_tracking_code feature flag is set to false
  def use_ga_tracking_code?
    FeatureFlags.derive(nil, request)[:enable_standard_ga_tracking] ||
      (FeatureFlags.derive(nil, request)[:enable_opendata_ga_tracking] != false)
  end

  # EN-4151: the "custom" ga tracking code is deprecated. We are moving towards a single
  # standard code that we will use for tracking all sites - standard_ga_tracking_code
  def custom_ga_tracking_code
    # If code is true or an empty string, fallback to the default custom GA code in APP_CONFIG.
    # If it's set to a specific value, use that value. If it is false, return false.
    code = FeatureFlags.derive(nil, request)[:enable_opendata_ga_tracking]
    (code == true || code.to_s.empty?) ? APP_CONFIG.opendata_ga_tracking_code : code
  end

  def standard_ga_tracking_code
    APP_CONFIG.standard_ga_tracking_code
  end

  def get_ga_tracking_code
    FeatureFlags.derive(nil, request)[:enable_standard_ga_tracking] ?
      standard_ga_tracking_code : custom_ga_tracking_code
  end

  def find_user_role
    current_user.try(:role_name) || 'none'
  end

  def find_user_id
    current_user.try(:id) || 'none'
  end

  def build_tracking_info_param
    # How to send custom dimensions
    # https://developers.google.com/analytics/devguides/collection/analyticsjs/custom-dims-mets
    #
    # Dimensions:
    #   dimension1: domain
    #   dimension2: DEPRECATED - User name
    #   dimension3: User type [admin, editor, etc]
    #   dimension4: Page type [personal catalog, profile page, etc]
    #   dimension5: User id (send this instead of user name)
    {dimension1: CurrentDomain.cname, dimension3: find_user_role, dimension5: find_user_id}.to_json
  end

  # Given that the Google Analytics feature flag is either set to true or an explicit value
  # render the Google Analytics tracking JavaScript code.
  def render_ga_tracking
    if use_ga_tracking_code?
      # Google analytics namespaced for multi tenant applications
      # http://benfoster.io/blog/google-analytics-multi-tenant-applications
      tracking_param = build_tracking_info_param
      javascript_tag(<<-eos)
        if (typeof window._gaSocrata === 'undefined') {
          (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
              m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
          })(window,document,'script','//www.google-analytics.com/analytics.js','_gaSocrata');
        }

        var extraDimensions = #{tracking_param};
        var metaTag = $('meta[name=page_name]')[0];
        if (metaTag) {
          extraDimensions['dimension4'] =  metaTag.getAttribute('content');
        }

        _gaSocrata('create', '#{get_ga_tracking_code}', 'auto', 'socrata');
        _gaSocrata('socrata.send', 'pageview', extraDimensions);
      eos
    end
  end

  def mixpanel_tracking_enabled?
    CurrentDomain.feature?(:mixpanelTracking) || CurrentDomain.feature?(:fullMixpanelTracking)
  end

  def font_tags
    out = ''

    if CurrentDomain.properties.typekit_id.present?
      out << <<-eos
        <script type="text/javascript" src="//use.typekit.net/#{CurrentDomain.properties.typekit_id}.js"></script>
        <script type="text/javascript">try{Typekit.load();}catch(e){}</script>
      eos
    elsif module_enabled?(:govStat)
      out << '<link href="https://fonts.googleapis.com/css?family=PT+Sans:400,700,400italic,700italic" rel="stylesheet" type="text/css">'
    end

    out.html_safe
  end

  # Takes dataset id and returns link to the alternate version of the dataset
  def get_alt_dataset_link(id)
    "/d/#{id}/alt"
  end

  def render_noscript(id)
    noscript = <<-eos
      <noscript>
        <div class="noscript-notification">
          <h4>You need to enable Javascript in your web browser to interact with the Data Lens experience.</h4>
          <p>
            You can alternatively explore the data using the
            <a href="#{get_alt_dataset_link(id)}">accessible version</a>
            of this Data Lens page.
          </p>
        </div>
      </noscript>
    eos
    noscript.html_safe
  end

  def current_user_can_create_story?
    FeatureFlags.derive.stories_enabled && current_user.has_right?(UserRights::CREATE_STORY)
  end

  # ONCALL-3032: Spam e-mail sent via the Socrata platform
  #
  # The ability for unauthenticated users to send 'share this dataset via email' messages
  # including arbitrary content was being abused by someone to send SPAM.
  #
  # Our solution, for the time being, is to disable this feature for unauthenticated or
  # non-domain-role-holding users. This is accomplished in the frontend with a feature
  # flag that hides the button which causes the send email dialog box to be shown; the
  # more substantive fix will be in Core Server and will entail disabling the endpoint
  # used to send unauthenticated email:
  #
  # /api/views/<four-four>.json?method=sendAsEmail&accessType=WEBSITE
  #
  # The work to disable this endpoint in Core Server is tracked by ONCALL-3037.
  #
  # Note that a different endpoint is used to send email on behalf of users who have
  # a domain role, and who we trust not to send spam:
  #
  # /api/views/<four-four>/grants/?accessType=WEBSITE
  #
  # This endpoint will remain active.
  #
  # I am not sure when `.has_right?(ViewRights::GRANT)` is expected to return non-nil: it is nil even
  # on a public dataset as a superadmin on my local machine. I am leaving it in place because
  # I can't understand its behavior.
  def user_has_domain_role_or_unauthenticated_share_by_email_enabled?(view)
    view.has_right?(ViewRights::GRANT) ||
    current_user_is_domain_member_and_has_create_datasets_right? ||
    view.is_public?
  end

  def current_user_is_domain_member_and_has_create_datasets_right?
    # If the current user is a member of this domain and can create datasets on this domain
    # we want to allow them to send email regardless of the state of the feature flag.
    # The dialog box used for this case hits a different, authenticated endpoint for email.
    current_user.present? && (CurrentDomain.member?(current_user) && current_user.has_right?(UserRights::CREATE_DATASETS))
  end

  def using_cetera?
    return false unless APP_CONFIG.cetera_host.present?

    uri = URI(APP_CONFIG.cetera_host)
    unless uri.host.present? && uri.scheme.present?
      Rails.logger.error('APP_CONFIG.cetera_host is incorrectly defined. Missing host and/or scheme')
      return false
    end

    req = request if defined?(request)

    # TODO: the admin page needs clytemnestra; only until cetera honors private datasets and other things
    return false if req.try(:path) =~ /^\/(admin)/

    # all dataslate pages are free to use cetera, by consideration after the blacklist is applied
    req ||= Canvas2::Util.request if Canvas2::Util.class_variable_defined?(:@@request)

    FeatureFlags.derive(nil, req, nil).cetera_search?
  end

  def using_cetera_profile_search?
    FeatureFlags.derive(nil, request, nil)[:cetera_profile_search]
  end

  def sprite_icon(opts)
    content_tag(:div, :class => opts[:class_name] || 'icon') do
      if opts[:alt_text].present?
        image_tag('/images/empty.gif', :size => '0x0', :alt => opts[:alt_text])
      end
    end
  end

  def request_ip_address
    request.try(:remote_ip) || env['REMOTE_ADDR']
  end

  # The intention here is to provide an opaque session id for metrics tracking purposes
  # that is derived from, but not fungible with, the session id used by the application.
  def safe_session_id
    Digest::SHA256.hexdigest(session['session_id'] + Rails.application.secrets.session_salt) if session['session_id'].present?
  end

  def request_id(_request = request)
    return 'Unavailable' unless _request.present?

    _request.headers['X-Socrata-RequestId'] || _request.headers['action_dispatch.request_id'].to_s.gsub('-', '')
  end

  # gets the active locale for the request.
  # returns nil if the active locale is the default (which makes it easy to use
  # with redirect rewriting).
  # this behavior can be changed by setting suppress_default to false.
  def current_locale(suppress_default = true)
    if suppress_default
      CurrentDomain.default_locale == I18n.locale.to_s ? nil : I18n.locale
    else
      I18n.locale
    end
  end

  def button_for_t(translation_string, url_options = {}, html_options = {})
    html_options = html_options.stringify_keys

    url = url_options.is_a?(String) ? url_options : url_for(url_options)

    form_options = html_options.delete('form').merge(
      :method => 'get',
      :action => url
    )

    html_options['type'] = 'submit'
    html_options['class'] = [html_options['class'], 'button'].compact.join(' ')

    if html_options['disabled']
      html_options['class'] = [html_options['class'], 'disabled'].compact.join(' ')
    end

    button = content_tag('button', t(translation_string), html_options)

    content_tag('form', button, form_options)
  end

  # Stolen from https://github.com/rails/rails/blob/b6c1ee0dfcb7ea8bfcac9daff0162876990665a3/actionview/lib/action_view/helpers/form_tag_helper.rb#L908-L910
  def sanitize_to_id(name)
    name.to_s.delete(']').tr('^-a-zA-Z0-9:.', "_")
  end

  def canary_warning
    return unless APP_CONFIG.canary
    content_tag(:style, :type => 'text/css') do
      %q[body:before {
        font-weight: bold;
        color: white;
        background-color: red;
        content: "CANARY!";
        display: block;
        font-size: 32px;
        padding: 5px;
      }].html_safe
    end
  end

end
