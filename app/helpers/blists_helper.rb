module BlistsHelper

  # Used for lists of views, to determine shared in/out
  def get_share_direction_icon_class_for_view(view)
    icon_class = "itemType"
    icon_class += view.is_blist? ? " typeBlist" : " typeFilter"

    if view.is_shared?
      icon_class += view.owner.id == current_user.id ? " sharedOut" : " sharedIn"
    end
    icon_class
  end

  # Used for individual views, to determine permission levels
  def get_permissions_icon_class_for_view(view)
    icon_class = view.is_blist? ? "typeBlist" : "typeFilter"

    if !view.is_public?
      icon_class += view.is_shared? ? " privateShared" : " private"
    else
      icon_class += " public"
    end
    icon_class
  end

  def get_type_string_for_view(view)

    sharing_type = ""
    if view.is_shared?
      sharing_type = view.owner.id == current_user.id ? " shared out" : " shared in"
    end

    blist_type = view.is_blist? ? "blist" : "filter"
    privacy_type = !view.is_public? ? "private" : ""

    out = "#{privacy_type} #{blist_type} #{sharing_type}"
  end

  def get_blist_tags
    views = View.find()

    tags = []
    views.each { |v| v.tags.nil? ? true : tags << v.tags.collect { |t| t.data } }
    tags.flatten.sort.uniq
  end

  def get_rating_class(rating)
    ['zero', 'one', 'two', 'three', 'four', 'five'][
      ((rating * 2.0).round / 2.0).floor] +
      ((rating * 2.0).round % 2 == 1 ? '_half' : '')
  end

  def get_comment_rating_html(comment)
    rating = comment.viewRating
    if rating > 0
      "<div class='rating #{get_rating_class(rating)}' " +
        "title='#{rating}'><span>#{rating}</span></div>"
    else
      ""
    end
  end

  def get_blist_rating_html(view)
    rating = view.averageRating
    "<div class='rating " +
      "#{get_rating_class(rating)}' " +
      "title='#{rating}'><span>#{rating}</span></div>"
  end

  def socialize_menu_options(view, menu_id = '')
    tweet = CGI::escape("Check out the #{h(view.name)} dataset on #{t(:blist_company)} - ")
    seo_path = "#{request.protocol + request.host_with_port + view.href}"
    short_path = "#{request.protocol + request.host_with_port.gsub(/www\./, '') + view.short_href}"

    {'id' => menu_id, 'option_menu' => true,
      'items' => [
      {'text' => 'Delicious', 'class' => 'delicious', 'href' => "http://del.icio.us/post?url=#{seo_path}&title=#{h(@view.name)}", 'external' => true},
      {'text' => 'Digg', 'class' => 'digg', 'href' => "http://digg.com/submit?phase=2&url=#{seo_path}&title=#{h(@view.name)}", 'external' => true},
      {'text' => 'Twitter', 'class' => 'twitter', 'href' => "http://www.twitter.com/home?status=#{tweet + short_path}", 'external' => true},
      {'text' => 'Facebook', 'class' => 'facebook', 'href' => "http://www.facebook.com/share.php?u=#{h(seo_path)}", 'external' => true}]}
  end

  def contacts_filter_menu(href_prefix, href_group_prefix,
                           title_key, title_group_key, id)
    items = [{'text' => 'Me', 'href' => href_prefix + current_user.id,
              'title' => get_title({title_key => current_user.id})}]

    items << {'section_title' => 'Groups'}
    groups = Group.find().sort {|a,b| a.name <=> b.name}
    first_char = ''
    groups.each do |g|
      name_char = g.name.slice(0, 1).upcase
      if name_char != first_char
        first_char = name_char
        items << {'section_title' => first_char, 'class' => 'sortHeader'}
      end
      items << {'text' => g.name, 'href' => href_group_prefix + g.id,
          'title' => get_title({title_group_key => g.id}), 
          'q' => "{'owner_group': '#{g.id}'}"
      }
    end

    items << {'section_title' => 'Friends'}
    contacts = Contact.find().sort {|a,b| a.displayName <=> b.displayName}
    first_char = ''
    contacts.each do |c|
      name_char = c.displayName.slice(0, 1).upcase
      if name_char != first_char
        first_char = name_char
        items << {'section_title' => first_char, 'class' => 'sortHeader'}
      end
      items << {'text' => c.displayName, 'href' => href_prefix + c.id,
          'title' => get_title({title_key => c.id}),
          'q' => "{'owner': '#{c.id}'}"
      }
    end
    menu_tag('id' => id, 'class' => 'contactsMenu', 'items' => items)
  end

  def columns_show_menu(view, args=nil)
    args ||= {}
    items = [{'button' => true, 'text' => 'Previous',
      'href' => '#prev', 'class' => 'prev'}]

    view.columns.each do |c|
      visible = !c.flag?('hidden')
      items << {'text' => h(c.name),
        'href' => "/views/#{view.id}/columns/#{c.id}", 
        'class' => get_datatype_class(c) + ' scrollable ' + (visible ? "checked" : "")}
    end

    items << {'button' => true, 'text' => 'Next',
      'href' => '#next', 'class' => 'next'}

    {'id' => args['id'], 'class' => 'checkboxMenu columnsMenu columnsShowMenu', 'items' => items}
  end

  def columns_menu(view, args = nil)
    args = args || {}
    modal = args.key?("modal") ? args["modal"] : false
    include_options = args['include_options'] || {}
    items = args['initial_items'] || []
    items.unshift({'button' => true, 'text' => 'Previous',
      'href' => '#prev', 'class' => 'prev'})

    view.columns.each do |c|
      # Check for whether or not to display hidden columns and list columns
      if (!c.flag?('hidden') || include_options['hidden']) &&
        (!c.is_list || include_options['list'])

        # For lists, the first (and only) child has all the real info
        if c.is_list
          next if c.childColumns.nil?
          c = c.childColumns[0]
          # The core server is returning hidden list columns as an empty bnb
          next unless c
        end

        # Now check if we should display nested table columns (this is not done
        # above, as we may want to not display nested table parents, but do
        # display nested table children)
        if (!c.is_nested_table || c.is_list ||
            include_options['nested_table']) &&
          (!args['column_test'] || args['column_test'].call(c))
          cur_item = {'text' => h(c.name),
            'modal' => modal,
            'href' => args['href_prefix'] + c.id.to_s, 
            'class' => get_datatype_class(c) + ' scrollable'}
          if (args['submenu'])
            cur_item['submenu'] = args['submenu'].call(c)
          end
          items << cur_item
        end

        # If we are displaying nested table children, loop through those (and
        # again check for visibility for each child)
        if c.is_nested_table && !c.is_list &&
          include_options['nested_table_children']
          (c.childColumns || []).each do |cc|
            if (!cc.flag?('hidden') || include_options['hidden']) &&
              (!args['column_test'] || args['column_test'].call(cc))
              cur_item = {'text' => h(c.name) + ': ' + h(cc.name),
                'modal' => modal,
                'href' => args['href_prefix'] + cc.id.to_s, 
                'class' => get_datatype_class(cc) + ' scrollable'}
              if (args['submenu'])
                cur_item['submenu'] = args['submenu'].call(cc)
              end
              items << cur_item
            end
          end
        end
      end
    end

    items.push({'button' => true, 'text' => 'Next',
      'href' => '#next', 'class' => 'next'})

    {'id' => args['id'], 'class' => 'columnsMenu', 'items' => items}
  end

  def column_aggregate_menu(column)
    aggs = column.dataType.possible_aggregates
    items = []
    aggs.each do |a|
      items << {'text' => a['title'],
        'class' => column.aggregate == a['name'] ? 'checked' : '',
        'href' => '#aggregate:' + column.id.to_s + ':' + a['name']}
    end
    {'option_menu' => true, 'items' => items}
  end

  def get_datatype_class(column)
    dtt = column.dataType.type.downcase
    if dtt == 'date'
      dtt = 'dateTime'
    elsif dtt == 'text'
      dtt = 'plainText'
      # Now check the format to see if it is formatted text
      if 'Rich' == column.text_format
        dtt = 'formattedText'
      end
    end
    dtt
  end

  def recent_blists_menu(cur_view, num_recent)
    if current_user
      {'items' => View.find().reject {|v| v.id == cur_view.id}.sort do |a,b|
        b.last_viewed <=> a.last_viewed
      end.slice(0, num_recent).map do |v|
        {'text' => v.name, 'href' => v.href,
        'class' => v.is_blist? ? 'blist' : 'filter'}
      end }
    else
      nil
    end
  end

  def type_select_options(selected_type = nil)
    options_for_select(Column.types.invert.sort { |a, b| a.first <=> b.first }, selected_type)
  end

  def category_select_options(selected_category = nil)
    options_for_select(View.categories.invert.sort { |a, b| a.first <=> b.first }, selected_category)
  end
  
  def license_select_options(selected_license = nil)
    if selected_license.include?("CC")
      selected_license = "CC"
    end
    options_for_select(View.licenses.invert.sort { |a, b| a.first <=> b.first }, selected_license)
  end
  
  def creative_commons_select_options(selected_option = nil)
    options_for_select(View.creative_commons.invert.sort { |a, b| a.first <=> b.first }, selected_option)
  end

  def get_publish_embed_code_for_view(view, width = "425", height = "344", variation = "")
    root_path = request.protocol + request.host_with_port
    embed_template =  "<div><p style=\"margin-bottom:3px\"><a href=\"#{root_path + view.href}\" " +
                      "target=\"_blank\" " +
                      "style=\"font-size:12px;font-weight:bold;" +
                      "text-decoration:none;color:#333333;font-family:arial;\">" +
                      "#{h(view.name)}</a></p><iframe width=\"" +
                      "#{width}px\" height=\"#{height}px\" src=\"#{root_path}" +
                      "/widgets/#{view.id}/#{variation}\" frameborder=\"0\" scrolling=\"no\">" +
                      "<a href=\"#{root_path + view.href}\" title=\"#{h(view.name)}\" " +
                      "target=\"_blank\">" +
                      "#{h(view.name)}</a></iframe>"
    if view.category.nil? || view.category.downcase != 'government'
      embed_template += "<p><a href=\"http://www.socrata.com/\" target=\"_blank\">" +
        "Powered by #{t(:blist_company)}</a></p>"
    end
    embed_template += "</div>"
  end
end
