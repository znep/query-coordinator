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

  def menu_tag(options = {})
    items = options['items']

    ret = "<ul id='" + options['id'].to_s + "' class='" + options['class'].to_s +
      (options['bare_menu'] ? '' : ' menu') +
      (options['option_menu'] ? " optionMenu" : '') + "'>"

    items.each do |i|
      if i['title'].nil?
        i['title'] = i['text']
      end
      if i['separator']
        ret += "<li class='separator'></li>"
      elsif i['section_title']
        ret += "<li class='sectionTitle #{i['class']}'>#{i['section_title']}</li>"
      elsif i['button']
        ret += "<li class='button #{i['class']}'>" +
          "<a title='#{i['title']}' href='#{i['href']}'>" +
          "<div class='outerWrapper'><div class='midWrapper'>" +
          "<span class='innerWrapper'>" +
          "#{i['text']}</span></div></div></a></li>"
      else
        ret += "<li class='#{i['class']}" + (i['submenu'] ? ' submenu' : '') +
          "'><a title='#{i['title']}' href='#{i['href']}'>" +
          "<span class='highlight'>#{i['text']}</span></a>"
        if i['submenu']
          ret += menu_tag(i['submenu'])
        end
        ret += "</li>"
      end
    end

    if !options['bare_menu']
      ret += "<li class='footer'><div class='outerWrapper'>" +
        "<div class='innerWrapper'>"
      ret += options['option_menu'] ? "<span class='colorWrapper'></span>" : ''
      ret += "</div></div></li>"
    end
    ret += "</ul>"

    return ret
  end

  def blist_date(time)
    time ? Time.at(time).strftime("%b %d, %Y") : nil
  end

  def blist_href_new_blist
    blist_url('new_blist')
  end

  def blist_href_import
    blist_url('import')
  end

  def sidebar_filter_link(content, params, current_params, is_default = false)
    "<a href='?" +
      (params.inject({}) {|h,(k,v)| h[k] = CGI.escape(v); h}.to_param) +
      "' title='#{h(get_title(params))}'" +
      (params == current_params || (current_params.empty? && is_default) ?
        "class='hilight'" : "") + ">#{content}</a>"
  end
  
  HUMANE_DATE_GRANULARITY = {
    :minute => 0,
    :hour => 3,
    :day => 6,
    :week => 9,
    :month => 12,
    :year => 15,
    :century => 18
  }
  HUMANE_DATE_TIME_FORMATS = [
    [60, 'just now'],
    [120, '1 minute ago', '1 minute from now'], # 60*2
    [3600, 'minutes', 60], # 60*60, 60
    [3600, 'this hour'], # 60*60, 60
    [7200, '1 hour ago', '1 hour from now'], # 60*60*2
    [86400, 'hours', 3600], # 60*60*24, 60*60
    [86400, 'today'], # 60*60*24, 60*60
    [172800, 'yesterday', 'tomorrow'], # 60*60*24*2
    [604800, 'days', 86400], # 60*60*24*7, 60*60*24
    [604800, 'this week'], # 60*60*24*7, 60*60*24
    [1209600, 'last week', 'next week'], # 60*60*24*7*4*2
    [2419200, 'weeks', 604800], # 60*60*24*7*4, 60*60*24*7
    [2419200, 'this month'], # 60*60*24*7*4, 60*60*24*7
    [4838400, 'last month', 'next month'], # 60*60*24*7*4*2
    [29030400, 'months', 2419200], # 60*60*24*7*4*12, 60*60*24*7*4
    [29030400, 'this year'], # 60*60*24*7*4*12, 60*60*24*7*4
    [58060800, 'last year', 'next year'], # 60*60*24*7*4*12*2
    [2903040000, 'years', 29030400], # 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [2903040000, 'this century'], # 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [5806080000, 'last century', 'next century'] # 60*60*24*7*4*12*100*2
  ]
  def humane_date(date_string, granularity = HUMANE_DATE_GRANULARITY[:minute])
    dt = Time.now.tv_sec
    date_obj = Time.parse(date_string).tv_sec
    seconds = (dt - date_obj)
    token = 'ago'
    list_choice = 1

    if (seconds < 0)
      seconds = seconds.abs
      token = 'from now'
      list_choice = 2
    end
    
    out = date_string
    
    start = granularity
    stop = HUMANE_DATE_TIME_FORMATS.length - 1
    for i in start..stop do 
      format = HUMANE_DATE_TIME_FORMATS[i]
      puts "seconds: " + seconds.to_s
      puts "format[0]: " + format[0].to_s
      if (seconds < format[0])
        if (format.length < 3)
          out = format[1]
        elsif (format[2].kind_of?(String))
          out = format[list_choice]
        else
          out = (seconds/format[2]).floor.to_s + ' ' + format[1] + ' ' + token
        end
        break
      end
    end
    
    # overflow for centuries
    if (seconds > 5806080000)
        out = (seconds / 2903040000).floor + ' centuries ' + token
    end
    
    out
  end
end
