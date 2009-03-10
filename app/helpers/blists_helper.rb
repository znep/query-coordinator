module BlistsHelper

  # Used for lists of lenses, to determine shared in/out
  def get_share_direction_icon_class_for_lens(lens)
    icon_class = "itemType"
    icon_class += lens.is_blist? ? " typeBlist" : " typeFilter"

    if lens.is_shared?
      icon_class += lens.owner.id == current_user.id ? " sharedOut" : " sharedIn"
    end
    icon_class
  end

  # Used for individual lenses, to determine permission levels
  def get_permissions_icon_class_for_lens(lens)
    icon_class = lens.is_blist? ? "typeBlist" : "typeFilter"

    if !lens.is_public?
      icon_class += lens.is_shared? ? " privateShared" : " private"
    else
      icon_class += " public"
    end
    icon_class
  end

  def get_type_string_for_lens(lens)

    sharing_type = ""
    if lens.is_shared?
      sharing_type = lens.owner.id == current_user.id ? " shared out" : " shared in"
    end

    blist_type = lens.is_blist? ? "blist" : "filter"
    privacy_type = !lens.is_public? ? "private" : ""

    out = "#{privacy_type} #{blist_type} #{sharing_type}"
  end

  def get_blist_tags
    lenses = Lens.find()

    tags = []
    lenses.each { |l| tags << l.tags.collect { |t| t.data } }
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

  def columns_menu(lens, args = nil)
    args = args || {}
    include_options = args['include_options'] || {}
    items = args['initial_items'] || []

    lens.columns.each do |c|
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
            'class' => get_datatype_class(c)}
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
                'class' => get_datatype_class(cc)}
              if (args['submenu'])
                cur_item['submenu'] = args['submenu'].call(cc)
              end
              items << cur_item
            end
          end
        end
      end
    end

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
end
