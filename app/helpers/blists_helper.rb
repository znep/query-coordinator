module BlistsHelper
  def get_add_column(desc, view_id, type)
    link_to(desc, new_blist_column_path(view_id) + "?type=#{type}", :rel => "modal", :id => "addColumn_#{type}")
  end

  def dataset_view_type(view)
    if view.is_blist?
      'blist'
    elsif view.is_calendar?
      'calendar'
    elsif view.is_visualization?
      'visualization'
    else
      'filter'
    end
  end

  # Used for lists of views, to determine shared in/out
  def get_share_direction_icon_class_for_view(view)
    icon_class = "itemType"
    icon_class += " type" + dataset_view_type(view).capitalize

    if view.is_shared?
      icon_class += view.owner.id == current_user.id ? " sharedOut" : " sharedIn"
    end
    icon_class
  end

  # Used for individual views, to determine permission levels
  def get_permissions_icon_class_for_view(view)
    icon_class = 'type' + dataset_view_type(view).capitalize

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

    blist_type = dataset_view_type(view)
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

  def share_menu_options(view)
    [{'text' => "Publish this #{t(:blist_name).titleize}...",
      'class' => 'publish', 'href' => '#publish'},
      {'text' => "Email this #{t(:blist_name).titleize}...", 'class' => 'email',
        'href' => "#{@view.href}/email", 'modal' => true},
      {'separator' => true, 'owner_item' => true},
      {'text' => "Share this #{t(:blist_name).titleize}...", 'class' => 'share',
      'href' => "#{@view.href}/share", 'modal' => true, 'owner_item' => true},
      {'separator' => true},
      {'text' => "Socialize this #{t(:blist_name).titleize}",
      'class' => 'socialize', 'href' => '#', 'submenu' =>
        {'class' => 'socializeMenu', 'option_menu' => true,
        'items' => socialize_menu_options(view)}}
    ]
  end

  def socialize_menu_options(view)
    tweet = CGI::escape("Check out the #{h(view.name)} dataset on #{th.company} - ")
    seo_path = "#{request.protocol + request.host_with_port + view.href}"
    short_path = "#{request.protocol + request.host_with_port.gsub(/www\./, '') + view.short_href}"

    [{'text' => 'Delicious', 'class' => 'delicious', 'external' => true,
      'href' => "http://del.icio.us/post?url=#{seo_path}&title=#{h(view.name)}"},
      {'text' => 'Digg', 'class' => 'digg', 'external' => true,
      'href' => "http://digg.com/submit?phase=2&url=#{seo_path}&title=#{h(view.name)}"},
      {'text' => 'Facebook', 'class' => 'facebook', 'external' => true,
      'href' => "http://www.facebook.com/share.php?u=#{h(seo_path)}"},
      {'text' => 'Twitter', 'class' => 'twitter', 'external' => true,
      'href' => "http://www.twitter.com/home?status=#{tweet + short_path}"}]
  end

  def view_create_menu_options(view)
    [{'text' => 'Filtered View', 'class' => 'filter', 'href' => '#createFilter'},
      {'text' => 'Calendar', 'href' => "#{view.href}/calendar",
      'class' => 'calendar' + (view.can_add_calendar? ? '' : ' disabled'),
      'title' => (view.can_add_calendar? ? '' :
        'This dataset does not have both a date column and text column')},
      {'text' => 'Visualization', 'href' => "#{view.href}/visualization",
      'class' => 'viz' + (view.can_add_visualization? ? '' : ' disabled'),
      'title' => (view.can_add_visualization? ? '' :
        'This dataset does not have the appropriate columns for visualizations')}]
  end

  def filter_submenu(view)
    filters = view.filters
    [{'text' => 'Show Row Tags', 'class' => 'rowTags', 'href' => '#show-rowTags'},
      {'text' => 'Column Totals', 'class' => 'columnTotals',
      'href' => '#', 'submenu' => columns_menu(view,
        {'href_prefix' => "#column_totals:", 'include_options' =>
          {'nested_table_children' => true, 'list' => true},
        'initial_items' => [{'section_title' => 'Add totals to:'}],
        'submenu' => method(:column_aggregate_menu),
        'column_test' => proc {|c, p| c.possible_aggregates.length > 1}})},
      {'separator' => true},
      {'text' => 'Filter...', 'class' => 'filter',
      'href' => blist_filters_path(view.id), 'modal' => true},
      {'text' => 'Sort Columns...', 'class' => 'sort',
      'href' => blist_sort_bys_path(view.id), 'modal' => true},
      {'text' => 'Show or Hide Columns', 'class' => 'showHide', 'href' => '#',
      'submenu' => columns_menu(view,
        {'initial_items' => [{'section_title' => 'Check/Uncheck to Show/Hide'},
            {'separator' => true}],
          'post_items' => (current_user && view.owner.id == current_user.id) ?
            [{'separator' => true},
          {'text' => 'Advanced...', 'class' => 'advancedShowHide',
          'href' => blist_show_hides_path(view.id), 'modal' => true}] : [],
          'href_prefix' => "#hide-show-col_", 'checkbox_menu' => true,
          'checkbox_callback' => proc { |c| !c.flag?('hidden') },
          'column_test' => proc {|c, p| p.nil? || !p.flag?('hidden')},
          'include_options' =>
            {'nested_table' => true, 'hidden' => true,
            'nested_table_children' => true, 'list' => true}
            })},
      {'separator' => true},
      {'text' => 'Create a Calendar View...', 'href' => "#{view.href}/calendar",
      'class' => 'calendar' + (view.can_add_calendar? ? '' : ' disabled'),
      'title' => (view.can_add_calendar? ? '' :
        'This dataset does not have both a date column and text column')},
      {'text' => 'Create a Chart View...', 'href' => "#{view.href}/visualization",
      'class' => 'visualization' + (view.can_add_visualization? ? '' : ' disabled'),
      'title' => (view.can_add_visualization? ? '' :
        'This dataset does not have the appropriate columns for visualizations')},
      # Map item
      {'separator' => true, 'if' => filters.length > 0},
      {'text' => 'More Views', 'class' => 'moreViews', 'href' => '#',
      'submenu' => {'class' => 'scrollableMenu', 'items' => [
        {'button' => true, 'text' => 'Previous',
        'href' => '#prev', 'class' => 'prev'}] +
        filters.sort {|a,b| a.name <=> b.name }.map do |v|
        {'text' => v.name, 'href' => v.href,
        'class' => dataset_view_type(v) + ' scrollable'}
      end + [{'button' => true, 'text' => 'Next',
      'href' => '#next', 'class' => 'next'}]}
    }]
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
          'title' => get_title({title_group_key => g.id, 'object' => g}),
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
          'title' => get_title({title_key => c.id, 'object' => c}),
          'q' => "{'owner': '#{c.id}'}"
      }
    end
    menu_tag('id' => id, 'class' => 'contactsMenu', 'items' => items)
  end

  def columns_menu(view, args = nil)
    args = args || {}
    modal = args.key?("modal") ? args["modal"] : false
    include_options = args['include_options'] || {}
    items = []
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
          (!args['column_test'] || args['column_test'].call(c, nil))
          cur_item = {'text' => h(c.name),
            'modal' => modal,
            'href' => args['href_prefix'] + c.id.to_s,
            'class' => get_datatype_class(c) + ' scrollable' +
              (args['checkbox_callback'] &&
               args['checkbox_callback'].call(c) ? ' checked' : '')}
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
              (!args['column_test'] || args['column_test'].call(cc, c))
              cur_item = {'text' => h(c.name) + ': ' + h(cc.name),
                'modal' => modal,
                'href' => args['href_prefix'] + cc.id.to_s,
                'class' => get_datatype_class(cc) + ' scrollable' +
                  (args['checkbox_callback'] &&
                   args['checkbox_callback'].call(cc) ? ' checked' : '')}
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

    items = (args['initial_items'] || []) + items + (args['post_items'] || [])

    {'id' => args['id'], 'class' => 'columnsMenu', 'items' => items,
      'checkbox_menu' => args['checkbox_menu']}
  end

  def column_aggregate_menu(column)
    aggs = column.possible_aggregates
    items = []
    aggs.each do |a|
      items << {'text' => a['title'],
        'class' => column.aggregate == a['name'] ? 'checked' : '',
        'href' => '#aggregate_' + column.id.to_s + '_' + a['name']}
    end
    {'option_menu' => true, 'items' => items}
  end

  def get_datatype_class(column)
    dtt = column.dataTypeName.downcase
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
        {'text' => v.name, 'href' => v.href, 'class' => dataset_view_type(v)}
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
  
  def font_unit_select_options(selected_unit = nil)
    options_for_select({'ems' => 'em', 'points' => 'pt', 'pixels' => 'px', 'inches' => 'in'}, selected_unit)
  end

  def images_select_options(selected_image = nil)
    image_options = [['None', 'none'], ['Socrata', 'default'], ['Upload a New Logo...', 'upload']]
    images = Image.find
    if images.size > 0
      image_options << ['', 'none']
      images.each { |image| image_options << [image.nameForOutput, image.id] }
    end
    options_for_select(image_options, selected_image)
  end

  def get_publish_embed_code_for_view(view, options = {}, variation = "", from_tracking_id = nil)
    # merge publish options with theme options if extant
    theme = WidgetCustomization.find(variation) if variation =~ /\w{4}-\w{4}/
    if theme.nil?
      options = WidgetCustomization.merge_theme_with_default({:publish => options})[:publish]
    else
      options = theme.customization[:publish].deep_merge(options)
    end

    # generate a new tracking ID param set
    tracking_params = { :cur => ActiveSupport::SecureRandom.base64(9).slice(0..10) }
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
                      "height=\"#{options[:dimensions][:height]}px\" src=\"#{root_path}" +
                      "/widgets/#{view.id}/#{variation.blank? ? 'normal' : variation}?" +
                      "#{tracking_params.to_param}\" frameborder=\"0\" scrolling=\"no\">" +
                      "<a href=\"#{root_path + view.href}\" title=\"#{h(view.name)}\" " +
                      "target=\"_blank\">#{h(view.name)}</a></iframe>"
    if options[:show_powered_by]
      embed_template += "<p><a href=\"http://www.socrata.com/\" target=\"_blank\">" +
        "Powered by #{th.company}</a></p>"
    end
    embed_template += "</div>"
  end

  # Create a drop down menu of formatting fonts
  # Pass a font name to select it by default.
  # TODO: This sucks keeping it in sync with our text editor; better place to
  # code this?
  def font_select_options(selected_font = nil)
    out = ""
    {'Andale Mono' => 'andale mono,times',
      'Arial' => 'arial,helvetica,sans-serif',
      'Arial Black' => 'arial black,avant garde',
      'Book Antiqua' => 'book antiqua,palatino',
      'Comic Sans MS' => 'comic sans ms,sans-serif',
      'Courier New' => 'courier new,courier',
      'Georgia' => 'georgia,palatino',
      'Helvetica' => 'helvetica',
      'Impact' => 'impact,chicago',
      'Symbol' => 'symbol',
      'Tahoma' => 'tahoma,arial,helvetica,sans-serif',
      'Terminal' => 'terminal,monaco',
      'Times New Roman' => 'times new roman,times',
      'Trebuchet MS' => 'trebuchet ms,geneva',
      'Verdana' => 'verdana,geneva',
      'Webdings' => 'webdings',
      'Wingdings' => 'wingdings,zapf dingbats'}.sort { |a,b| a[0] <=> b[0] }.
        each do |font|
      selected = selected_font == font[0] ?
        " selected=\"selected\" class=\"default\"" : ""
      out += "<option value=\"#{font[1]}\"#{selected}>#{font[0]}</option>"
    end
    out
  end

  # Create a drop down menu of formatting font sizes
  # Pass a font size to select it by default.
  # TODO: This sucks keeping it in sync with our text editor; better place to
  # code this?
  def font_size_select_options(selected_font_size = nil)
    out = ""
    {8 => 6, 10 => 8, 12 => 10, 14 => 12, 18 => 16, 24 => 22,
      36 => 34}.sort {|a,b| a[0] <=> b[0]}.
      each do |size|
      selected = selected_font_size == size[0] ?
        " selected=\"selected\" class=\"default\"" : ""
      out += "<option value=\"#{size[1]}\"#{selected}>#{size[0]}</option>"
    end
    out
  end
end
