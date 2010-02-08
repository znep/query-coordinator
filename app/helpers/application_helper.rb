# Methods added to this helper will be available to all templates in the application.
module ApplicationHelper
  # Return a string that represents the specified menu.  The only required option
  # is 'items'
  #
  # Options:
  #   items:
  #     An array of menu entries.  Each one should be a hash with these options:
  #       separator:
  #         If set to true, renders a separator instead of a link
  #       section_title:
  #         If this has text, it will render a section title instead of a link
  #       text:
  #         Text to display for the item
  #       href:
  #         URL to link to
  #       class:
  #         CSS class for this item
  #       submenu:
  #         Hash that represents a full menu item; recursively calls this function
  #
  #   id:
  #     id attribute for the menu
  #
  #   bare_menu:
  #     If set to true, leaves off the 'menu' class and footer
  #
  #   option_menu:
  #     If set to true, renders an option menu (adds a class and different styling)

  @@menuUID = 0

  def menu_tag(options = {}, is_owner = false, can_edit = false)
    items = options['items']
    if options['id'].blank?
      options['id'] = 'autofill_' + @@menuUID.to_s
      @@menuUID += 1
    end

    ret = StringIO.new
    ret << "<ul id='" << options['id'].to_s << "' class='" <<
    options['class'].to_s << (options['bare_menu'] ? '' : ' menu') <<
    (options['option_menu'] ? " optionMenu" : '') <<
    (options['checkbox_menu'] ? " checkboxMenu" : '') << "'>"

    last_item_was_separator = true
    prev_separator = ''

    items.each do |i|
      if i.has_key?('upsell') && upsell?
        # upsell item, so merge upsell options in as override
        i.deep_merge!(i['upsell'])
      else
        # only do feature/module related checks if we're not upselling
        if (i.has_key?('module_available') && !(module_available? i['module_available'])) ||
           (i.has_key?('module_enabled') && !(module_enabled? i['module_enabled'])) ||
           (i.has_key?('feature') && !(feature? i['feature']))
          next
        end
      end

      # always do these checks
      if (i['owner_item'] && !is_owner) || (i['owner_item'] == false && is_owner) ||
        (i['edit_item'] && !can_edit) || (i['edit_item'] == false && can_edit) ||
        (i['user_required'] && !current_user) ||
        (!i['if'].nil? && !i['if']) ||
        (last_item_was_separator && i['separator']) ||
        (i.has_key?('submenu') && (i['submenu'].nil? ||
                                   i['submenu']['items'].nil? ||
                                   i['submenu']['items'].length < 1)) ||
        (i['user_in_domain'] && !(CurrentDomain.member? current_user))
        next
      end

      ret << prev_separator
      last_item_was_separator = false
      prev_separator = ''

      if i['title'].nil?
        i['title'] = i['text']
      end
      if i['separator']
        prev_separator = "<li class='separator" << "'></li>"
        last_item_was_separator = true
      elsif i['section_title']
        ret <<
          "<li class='sectionTitle #{i['class']}'>#{h(i['section_title'])}</li>"
      elsif i['button']
        ret << "<li class='button #{i['class']}'>" <<
          "<a title='#{h(i['title'])}' href='#{i['href']}' q=\"#{i['q']}\">" <<
          "<div class='outerWrapper'><div class='midWrapper'>" <<
          "<span class='innerWrapper'>" <<
          "#{h(i['text'])}</span></div></div></a></li>"
      else
        ret << "<li class='#{i['class']}" << (i['submenu'] ? ' submenu' : '') <<
          "'><a title='#{h(i['title'])}' " <<
          "href='#{i['href']}' q=\"#{i['q']}\" class=\"#{i['link_class']}" <<
          (i['submenu'] ? ' submenuLink' : '') <<
          (i['external'] ? ' externalLink' : '') << "\"" <<
          (i['external'] ? ' rel="external"' :
            (i['modal'] ? ' rel="modal"' : '')) << ">" <<
          "<span class='highlight'>#{h(i['text'])}</span></a>"
        if i['submenu']
          ret << menu_tag(i['submenu'], is_owner, can_edit)
        end
        ret << "</li>"
      end
    end

    if !options['bare_menu']
      ret << "<li class='footer'><div class='outerWrapper'>" <<
        "<div class='innerWrapper'>"
      ret << (options['option_menu'] || options['checkbox_menu'] ?
        "<span class='colorWrapper'></span>" : '')
      ret << "</div></div></li>"
    end
    ret << "</ul>"

    return ret.string
  end

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

  def blist_href_new_blist
    blist_path('new')
  end

  def sidebar_filter_link(content, params, current_params, is_default = false)
    escaped = params.inject({}) {|h, (k,v)| h[k] = CGI.escape(v); h}
    href = escaped.to_param
    title = h(get_title(params))
    cls = (params == current_params || (current_params.empty? && is_default) ? 'hilight' : '')

    return <<HREF
<a href="?#{href}" title="#{title}" class="#{cls}" q="#{params.to_json.gsub(/"/, "'")}">#{content}</a>
HREF
  end
  
  
  def get_filter_hilight_class(this_filter, current_filter, hilight_class)
    out = ""
    if (!current_filter.nil? && (current_filter == this_filter || current_filter.include?(this_filter)))
      out = hilight_class
    end
    out
  end
  
  def get_tag_hilight_class(this_tag, current_tag, hilight_class)
    out = ""
    if (!current_tag.nil? && current_tag == this_tag)
      out = hilight_class
    end
    out
  end


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

  def is_gov_site?
    I18n.locale == 'gov'
  end
  
  
  def create_pagination(total_count, page_count, current_page, base_href)
    puts "######## create_pagination(#{total_count}, #{page_count}, #{current_page}, #{base_href})"

    num_pages = (total_count.to_f / page_count).ceil
    base_href.sub!(/([?&])page=[0-9]*/, '\1')
    base_href = (base_href.include?("?") || base_href.include?("#")) ? "#{base_href}&page=" : "#{base_href}?page="
    base_href.sub!(/&&+/, '&')
    
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
      out += link_to("Prev", base_href + (current_page - 1).to_s, :class => "prevLink", :title => "Previous")
    end
    if (start_page > 1)
      out += "<span class='ellipses'>...</span>" 
    end
    (start_page..end_page).each do |i|
      page_link_class = i == current_page ? "pageLink active" : "pageLink"
      out += link_to(i, base_href + i.to_s, :class => page_link_class, :title => "Page #{i}")
    end
    if (end_page < num_pages)
      out += "<span class='ellipses'>...</span>"
    end
    if (current_page < num_pages)
      out += link_to("Next", base_href + (current_page + 1).to_s, :class => "nextLink", :title => "Next")
    end
    
    out += "</div>"
  end

  def fullpage_content(id = nil, &block)
    concat(content_tag(:div, :id => id, :class => 'tabPageContentContainer') do
      content_tag(:div, :class => "fullPageContentBL") do
        content_tag(:div, :class => "fullPageContentBR") do
          content_tag(:div, :class => "fullPageContent") do
            capture(&block)
          end
        end
      end
    end)
  end

  def meta_tags(meta)
    meta.reject!{|k,v| v.blank?}
    meta.map do |key, value|
      if value.is_a? Array
        value = value.join(',')
      end
      %Q[<meta name="#{key.to_s}" value="#{escape_once(value)}" />]
    end.join("\n")
  end

  def dialog_content(id = nil, inner_class = nil, &block)
    concat(
      content_tag(:div, :id => id, :class => "dialogWrapper") do
        content_tag(:div, :class => "dialogTL") do
          content_tag(:div, :class => "dialogBR") do
            content_tag(:div, :class => "dialogBL") do
              content_tag(:div, :class => "dialogOuter") do
                content_tag(:div, :class => "dialogBox #{inner_class}") do
                  capture(&block)
                end
              end
            end
          end
        end
      end
    )
  end

  def summary_tab(tab_label, tab_name = nil, is_expanded = false)
    return "<div class=\"summaryTab\"><div class=\"summaryTabContent\">" +
          "<a href=\"#expand\" class=\"expander#{is_expanded ? ' expanded' : ''}\" title=\"more info\">more info</a>" +
          "<a href=\"##{tab_name}\">#{tab_label}</a>" +
        "</div></div>"
  end

  def prerendered_cache(name = {}, prerendered_content = nil, options = nil, &block)
    @controller.prerendered_fragment_for(output_buffer, name, prerendered_content, options, &block)
  end

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

  def upsell(&block)
    concat(capture(&block)) if CurrentDomain.upsell?
  end

  def upsell?
    CurrentDomain.upsell?
  end

  # Returns the meta keyword tags for this view that we'll use in headers
  @@default_meta_tags = ["public", "data", "statistics", "dataset"]
  def meta_keywords(view)
    view.nil? ? nil : (view.tags.nil? ? @@default_meta_tags : view.tags + @@default_meta_tags).sort_by {rand}
  end

  # Return the description we'll use in the meta description header
  def meta_description(view)
    return nil if(view.nil? || !view.is_a?(View))

    if view.description.blank?
      desc = "View this dataset"
      updated_at = view.rowsUpdatedAt.nil? ? nil : blist_long_date(view.rowsUpdatedAt)
      if updated_at
        desc += ", last updated #{updated_at}"
      end
      return desc
    else
      return view.description
    end
  end

  def flash_clipboard_button(text)
    html = <<-EOF
      <object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"
              width="110"
              height="14"
              id="clippy" >
      <param name="movie" value="/clippy.swf"/>
      <param name="allowScriptAccess" value="always" />
      <param name="quality" value="high" />
      <param name="scale" value="noscale" />
      <param NAME="FlashVars" value="text=#{h(text)}">
      <param name="wmode" value="transparent">
      <embed src="/clippy.swf"
             width="110"
             height="14"
             name="clippy"
             quality="high"
             allowScriptAccess="always"
             type="application/x-shockwave-flash"
             pluginspage="http://www.macromedia.com/go/getflashplayer"
             FlashVars="text=#{h(text)}"
             wmode="transparent"
      />
      </object>
    EOF
  end

  # Generate a parameter hash given a current page state and additional flags
  def generate_filter_url(current_state, type, additional_flags = {}, delimiter = '#')
    if current_state.nil?
      state = Hash.new
    else
      state = current_state.dup
    end
    
    # If current state already contains an additional flag, toggle instead
    additional_flags.each do |key, value|
      if state[key] == value
        state.delete(key)
        additional_flags.delete(key)
      end
    end

    # Merge all flags
    state[:type] = type
    state.merge!(additional_flags)

    # Deal with filter[key] special case if filter exists and is a hash
    if state.has_key?(:filter) && state[:filter].respond_to?("each")
      state[:filter].each { |key, value| state["filter[#{key}]"] = value }
      state.delete(:filter)
    end

    # Final cleanup and output
    state.reject! { |key, value| value.nil? || (value == "") || (value == false) }
    out = state.map { |pair| pair.map{ |item| CGI::escape(item.to_s) }.join("=") }.join('&')
    "#{delimiter}#{out}"
  end

  def link_to_rpx(name, return_url = rpx_return_login_url, html_options = {})
    html_options.merge!({:class => 'rpxnow', :onclick => 'return false;'})

    link_to name, "#{APP_CONFIG['rpx_signin_url']}?token_url=#{return_url}", html_options
  end

  def rpx_submit_facebook(action = "Sign in", return_url = rpx_return_login_url)
    description = "#{action} with Facebook"
    content_tag(:form, {:action => "#{APP_CONFIG['rpx_facebook_url']}?token_url=#{return_url}", :method => 'post'}) do
      image_submit_tag(image_path('rpx/facebook.png'), :title => description, :alt => description)
    end
  end

  def rpx_submit_google(action = "Sign in", return_url = rpx_return_login_url)
    description = "#{action} with Google"
    content_tag(:form, {:action => "#{APP_CONFIG['rpx_openid_url']}?token_url=#{return_url}", :id => 'googrpx', :method => 'post'}) do
      hidden_field_tag('openid_identifier', 'https://www.google.com/accounts/o8/id') +
      image_submit_tag(image_path('rpx/google.png'), :title => description, :alt => description)
    end
  end

  def rpx_submit_yahoo(action = "Sign in", return_url = rpx_return_login_url)
    description = "#{action} with Yahoo"
    content_tag(:form, {:action => "#{APP_CONFIG['rpx_openid_url']}?token_url=#{return_url}", :id => 'googrpx', :method => 'post'}) do
      hidden_field_tag('openid_identifier', 'yahoo.com') +
      image_submit_tag(image_path('rpx/yahoo.gif'), :title => description, :alt => description)
    end
  end

  def rpx_submit_windowslive(action = "Sign in", return_url = rpx_return_login_url)
    description = "#{action} with Windows Live ID"
    content_tag(:form, {:action => "#{APP_CONFIG['rpx_windowslive_url']}?token_url=#{return_url}", :method => 'post'}) do
      image_submit_tag(image_path('rpx/windowslive.gif'), :title => description, :alt => description)
    end
  end

  def jquery_include
    if ENV["RAILS_ENV"] != 'production'
      return '<script src="/javascripts/jquery-1.4.1.js" type="text/javascript" ' +
        'charset="utf-8"></script>'
    else
      return <<-EOS
        <script type="text/javascript">
          document.write([
            "\\<script src='",
            ("https:" == document.location.protocol) ? "https://" : "http://",
            "ajax.googleapis.com/ajax/libs/jquery/1.4.1/jquery.min.js'",
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

  # Simple technique to do nested layouts. If you want to include one layout
  # inside of another, in the inner layout, put the following at the bottom
  # of your layouts/foo.html.erb:
  #
  # <% parent_layout('outer') %>
  def parent_layout(layout)
    @content_for_layout = self.output_buffer
    self.output_buffer = render(:file => "layouts/#{layout}")
  end

  def render_domain_template(tmpl)
    DOMAIN_TEMPLATES.each do |subst|
      pattern = '{{' + subst + '}}'
      tmpl.gsub!(pattern, render(:partial => 'shared/template/' + subst)) if
        tmpl.include?(pattern)
    end

    tmpl.gsub!(/\{\{string\.(\w+)\}\}/) {|match| CurrentDomain.strings[$1]}

    tmpl.gsub!(/\{\{urls\.(\w+)\}\}/) do |match|
      (CurrentDomain.theme.urls[$1] || []).map do |url|
        '<li>' + link_from_theme(url) + '</li>'
      end.join('')
    end

    return tmpl
  end

  def domain_header
    header_tmpl =
      case
      when CurrentDomain.cname.match(/medicare/)
        <<-EOS
          {{main_logo}}

          <div class='userNav'>
            <ul>
              {{urls.header}}
              {{sign_in_link}}
              {{sign_up_link}}
              {{user_home_link}}
              {{account_link}}
              {{sign_out_link}}
            </ul>
          </div>

          {{data_search_field}}
        EOS

      when CurrentDomain.cname.match(/cms/)
        <<-EOS
          {{main_logo}}

          <a id="hhsLink" href="http://www.hhs.gov/">www.hhs.gov</a>

          <div class='userNav'>
            <ul>
              <li class='favoriteLink'>
                <script src="http://s7.addthis.com/js/250/addthis_widget.js?pub=cmsgov" type="text/javascript"></script>
                <a title="Bookmark &amp; Share this page" onclick="return addthis_sendto()" onmouseout="addthis_close()" onmouseover="return addthis_open(this, '', '[URL]', '[TITLE]')" class="BannerToolsShareLink" href="http://www.addthis.com/bookmark.php?v=250&amp;pub=cmsgov">
                  Bookmark &amp; Share
                </a>
              </li>
              {{sign_in_link}}
              {{sign_up_link}}
              {{user_home_link}}
              {{account_link}}
              {{sign_out_link}}
            </ul>
          </div>

          {{data_search_field}}
        EOS

      when CurrentDomain.cname.match(/chicago/)
        <<-EOS
          {{main_logo}}

          <h2 id="mainSubtitle">Data Portal</h2>

          <div class='userNav'>
            <ul>
              {{sign_in_link}}
              {{sign_up_link}}
              {{account_link}}
              {{sign_out_link}}
            </ul>
          </div>

          {{main_nav}}

          {{data_search_field}}
        EOS

      else
        <<-EOS
          {{main_logo}}

          {{main_nav}}

          <div class='userNav'>
            <ul>
              {{urls.header}}
              {{sign_in_link}}
              {{sign_up_link}}
              {{account_link}}
              {{sign_out_link}}
            </ul>
          </div>

          {{header_search_field}}
        EOS
      end

    return render_domain_template(header_tmpl)
  end

  def domain_footer
    footer_tmpl =
      case
      when CurrentDomain.cname.match(/cms/)
        <<-EOS
        <div class="footerContainer">
          <div class="cmsFooterUpper">
            <ul>
              <li><a href="http://www.hhs.gov/">
                Department of Health and Human Services
              </a></li>
              <li><a href="http://www.medicare.gov/">Medicare.gov</a></li>
              <li><a href="http://www.usa.gov/">USA.gov</a></li>
              <li><a href="http://www.cms.gov/aboutwebsite">
                Web Policies &amp; Important Links
              </a></li>
              <li><a href="http://www.cms.gov/AboutWebsite/02_Privacy%20Policy.asp">
                Privacy Policy
              </a></li>
            </ul>
            <ul>
              <li><a href="http://www.cms.gov/AboutWebsite/04_FOIA.asp">
                Freedom of Information Act
              </a></li>
              <li><a href="http://www.cms.gov/AboutWebsite/06_NoFearAct.asp">
                No Fear Act
              </a></li>
              <li><a href="http://www.cms.gov/ContactCMS">Contact CMS</a></li>
            </ul>
          </div>
          <div class="cmsFooterLower">
            Centers for Medicare &amp; Medicaid Services,
            7500 Security Boulevard, Baltimore, MD 21244
          </div>
        </div>
        EOS
      else
        <<-EOS
        <div class="footerContainer">
          <div id='footer' class="clearfix">
            <span class='copyright'>{{string.copyright_string}}</span>
            <ul class='clearfix'>
              {{urls.footer}}
            </ul>
          </div>
        </div>
        EOS
      end

    return render_domain_template(footer_tmpl)
  end

  def domain_data_splash
    tmpl =
      case
      when CurrentDomain.cname.match(/seattle/)
        <<-EOS
        <div class="pageBlockHeaderOuter seattleWelcomeHeader">
          <div class="seattleBlockHeaderTL"><div class="seattleBlockHeaderTR">
          <div class="seattleBlockHeaderBL"><div class="seattleBlockHeaderBR">
            <div class="pageBlockSearch">
              <p class="searchIntro">{{string.discover_search_intro}}</p>
              {{data_search_field}}
            </div>

            <p class="seattleTitle">Welcome To</p>
            <div class="seattleLogo">Data.Seattle.Gov</div>
            <p class="seattleMain">The purpose of Data.Seattle.Gov is to
              increase public access to high value, machine readable datasets
              generated by various departments of Seattle City government.</p>
            <p class="seattleText">This initial launch provides a limited set
              of datasets - those currently shown on
              <a href="http://web1.seattle.gov/mnm/">My Neighborhood Map</a> -
              which is primarily City government data.  Beginning in
              approximately late January, we will begin adding additional
              datasets to the site.  At that time, we will invite you to
              actively participate in shaping the future of
              <a href="/">Data.Seattle.Gov</a> by suggesting additional
              datasets and site enhancements to provide seamless access and use
              of City data.</p>
            <p class="seattleText">Please note that by accessing the data
              catalog and feeds, you agree to our
              <a href="/data-policy">Terms of Use</a>.
              Please read before accessing the data.</p>
          </div></div>
          </div></div>
        </div>
        EOS

      when CurrentDomain.cname.match(/medicare/)
        <<-EOS
        <div class="pageBlockHeaderOuter medicareWelcomeHeader">
          <div class="medicareBlockHeaderTL"><div class="medicareBlockHeaderBL">
            <p class="medicareTitle">Welcome To Data.Medicare.Gov</p>
            <p class="medicareText">Data.Medicare.Gov has been created to work
              in parallel with <a href="http://www.medicare.gov">Medicare.gov</a>,
              allowing users to access data in an interactive format. Within
              each dataset, a user can sort and filter with multiple criteria
              and share the information using various web sources.</p>
            <p class="medicareText">Primarily used by health policy researchers
              and the media, this site is not intended to be used as a search
              tool.  You can access all search tools by visiting the
              <a href="http://www.medicare.gov">Medicare.gov</a> website.</p>
          </div></div>
        </div>
        EOS

      when CurrentDomain.cname.match(/chicago/)
        <<-EOS
        <div class="pageBlockHeaderOuter chicagoWelcomeHeader">
          <div class="pageBlockHeaderContainer">
            <p class="chicagoTitle">Welcome to the City of Chicago&rsquo;s
              <strong>Data Portal,</strong></p>
            <p class="chicagoSubtitle">where you can browse, search and
              download a variety of data collected and maintained by the City.</p>
            <p class="chicagoText">We are making this data available to promote
              transparency, and to encourage you to create new and innovative
              tools to engage and serve Chicago&rsquo;s richly diverse people,
              businesses, visitors, institutions and communities.</p>
            <p class="chicagoText">As part of the City&rsquo;s
              <a href="http://chicago.illinois.gov/city/en/progs/transparency.html">Transparency Initiatives</a>, more data sets will be
              added to this portal on a continuing basis. We invite you to
              participate in the evolution of Chicago&rsquo;s data catalog by telling
              us what other types of data you would like to see here and about
              the creative ways you are using this data. Before accessing or
              sharing data, please read the
              <a href="http://chicago.illinois.gov/city/en/narr/foia/data_disclaimer.html">Terms of Use</a>.</p>
            <div class="pageBlockHeaderR"></div>
          </div>
        </div>
        EOS

      when CurrentDomain.cname.match(/cms/)
        ''

      else
        <<-EOS
        <div class="pageBlockHeaderOuter">
          <div class="pageBlockHeaderTR"><div class="pageBlockHeaderTL"></div></div>
          <div class="pageBlockHeaderContainer">
            <div class="pageBlockIntro">
              <p>{{string.discover_header}}</p>
            </div>
            <div class="pageBlockSearch">
              <p class="searchIntro">{{string.discover_search_intro}}</p>
              {{data_search_field}}
            </div>
            <div class="pageBlockHeaderContent clearfix">
              {{data_carousel}}

              {{network_activity}}
            </div>
          </div>
          <div class="pageBlockHeaderBR"><div class="pageBlockHeaderBL"></div></div>
        </div>
        EOS
      end

    return render_domain_template(tmpl)
  end

  safe_helper :menu_tag, :meta_tags, :jquery_include, :javascript_error_helper_tag,
    :create_pagination, :sidebar_filter_link, :flash_clipboard_button, :summary_tab,
    :render_domain_template
end
