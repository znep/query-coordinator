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
    views.each { |v| tags << v.tags.collect { |t| t.data } }
    tags.flatten.sort.uniq
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
          'title' => get_title({title_group_key => g.id})}
    end

    items << {'section_title' => 'Contacts'}
    contacts = Contact.find().sort {|a,b| a.displayName <=> b.displayName}
    first_char = ''
    contacts.each do |c|
      name_char = c.displayName.slice(0, 1).upcase
      if name_char != first_char
        first_char = name_char
        items << {'section_title' => first_char, 'class' => 'sortHeader'}
      end
      items << {'text' => c.displayName, 'href' => href_prefix + c.id,
          'title' => get_title({title_key => c.id})}
    end
    menu_tag('id' => id, 'class' => 'contactsMenu', 'items' => items)
  end

  def columns_menu(view, args = nil)
    args = args || {}
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
          c = c.childColumns[0]
        end

        # Now check if we should display bnb columns (this is not done above,
        #  as we may want to not display bnb parents,
        #  but do display bnb children)
        if (!c.is_blist_in_blist || c.is_list ||
            include_options['blist_in_blist']) &&
          (!args['column_test'] || args['column_test'].call(c))
          cur_item = {'text' => c.name,
            'href' => args['href_prefix'] + c.id.to_s,
            'class' => get_datatype_class(c) + ' scrollable'}
          if (args['submenu'])
            cur_item['submenu'] = args['submenu'].call(c)
          end
          items << cur_item
        end

        # If we are displaying bnb children, loop through those (and again
        #  check for visibility for each child)
        if c.is_blist_in_blist && !c.is_list && include_options['bnb_children']
          c.childColumns.each do |cc|
            if (!cc.flag?('hidden') || include_options['hidden']) &&
              (!args['column_test'] || args['column_test'].call(cc))
              cur_item = {'text' => c.name + ': ' + cc.name,
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
    elsif dtt == 'blist_in_blist'
      dtt = 'bnb'
    elsif dtt == 'text'
      dtt = 'plainText'
      # Now check the format to see if it is formatted text
      if 'Rich' == column.text_format
        dtt = 'formattedText'
      end
    end
    dtt
  end
  
  def category_select_options(selected_category = nil)
    out = ""
    View.categories.sort { |a,b| a[1] <=> b[1] }.each do |category|
      selected = selected_category == category[0] ? " selected=\"selected\"" : ""
      out += "<option value=\"#{category[0]}\"#{selected}>#{category[1]}</option>"
    end
    out
  end
end
