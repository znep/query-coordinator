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

  def menu_tag(options = {}, is_owner = false, can_edit = false)
    items = options['items']

    ret = StringIO.new
    ret << "<ul id='" << options['id'].to_s << "' class='" <<
    options['class'].to_s << (options['bare_menu'] ? '' : ' menu') <<
    (options['option_menu'] ? " optionMenu" : '') << "'>"

    items.each do |i|
      if (i['owner_item'] && !is_owner) || (i['swf_item'] && !can_edit) ||
        (i['user_required'] && !current_user)
        next
      end

      if i['title'].nil?
        i['title'] = i['text']
      end
      if i['separator']
        ret << "<li class='separator" << (i['swf_item'] ? ' swfItem' : '') <<
        "'></li>"
      elsif i['section_title']
        ret << "<li class='sectionTitle #{i['class']}'>#{i['section_title']}</li>"
      elsif i['button']
        ret << "<li class='button #{i['class']}'>" <<
          "<a title='#{i['title']}' href='#{i['href']}' q=\"#{i['q']}\">" <<
          "<div class='outerWrapper'><div class='midWrapper'>" <<
          "<span class='innerWrapper'>" <<
          "#{i['text']}</span></div></div></a></li>"
      else
        if i.has_key?('submenu') && (i['submenu'].nil? ||
                                     i['submenu']['items'].nil? ||
                                     i['submenu']['items'].length < 1)
          next
        end

        ret << "<li class='#{i['class']}" << (i['submenu'] ? ' submenu' : '') <<
          (i['swf_item'] ? ' swfItem' : '') << "'><a title='#{i['title']}' " <<
          "href='#{i['href']}' q=\"#{i['q']}\">" <<
          "<span class='highlight'>#{i['text']}</span></a>"
        if i['submenu']
          ret << menu_tag(i['submenu'], is_owner, can_edit)
        end
        ret << "</li>"
      end
    end

    if !options['bare_menu']
      ret << "<li class='footer'><div class='outerWrapper'>" <<
        "<div class='innerWrapper'>"
      ret << (options['option_menu'] ? "<span class='colorWrapper'></span>" : '')
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
    blist_path('new_blist')
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
    num_pages = (total_count / page_count).ceil
    base_href = (base_href.include?("?")) ? "#{base_href}&page=" : "#{base_href}?page="
    
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
      %Q[<meta name="#{key.to_s}" value="#{sanitize(value)}" />]
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

end
