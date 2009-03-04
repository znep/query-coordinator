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
      if i['separator']
        ret += "<li class='separator'></li>"
      elsif i['section_title']
        ret += "<li class='sectionTitle #{i['class']}'>#{i['section_title']}</li>"
      else
        if i['title'].nil?
          i['title'] = i['text']
        end
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
    time ? Time.at(time/1000).strftime("%b %d, %Y") : nil
  end

  def login_logout_link
    unless current_user_session
      link_to('Sign In', login_url)
    else
      link_to('Sign Out', logout_url)
    end
  end
  
end
