module BlistsHelper
  def get_add_column(desc, view_id, type)
    link_to(desc, new_blist_column_path(view_id) + "?type=#{type}", :rel => "modal", :id => "addColumn_#{type}")
  end

  # Used for lists of views, to determine shared in/out
  def get_share_direction_icon_class_for_view(view)
    icon_class = "itemType"
    icon_class += " type" + view.display.type.capitalize

    if view.is_shared?
      icon_class += view.owner.id == current_user.id ? " sharedOut" : " sharedIn"
    end
    icon_class
  end

  # Used for individual views, to determine permission levels
  def get_permissions_icon_class_for_view(view)
    icon_class = 'type' + view.display.type.capitalize

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

    blist_type = view.display.type
    privacy_type = !view.is_public? ? "private" : ""

    out = "#{privacy_type} #{blist_type} #{sharing_type}"
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

  def dataset_menu_lookup(view, is_widget = false, theme = nil)
    tag_show_hide = view.columns && (view.columns.find {|c| c.client_type == 'tag'}.
      flag?('hidden')) ? 'show' : 'hide'

    filters = (theme.nil? || theme[:menu][:more_views]) ? view.filters : []

    tweet = CGI::escape("Check out the #{h(view.name)} dataset on #{CurrentDomain.strings.company} - ")
    seo_path = "#{request.protocol + request.host_with_port + view.href}"
    short_path = "#{request.protocol + request.host_with_port.gsub(/www\./, '') +
      view.short_href}"

    options = {
    'separator' => {'separator' => true},

    'print' => {'text' => "Print this #{t(:blist_name).titleize}...",
      'class' => 'print', 'href' => "#{view.href}/print", 'modal' => true,
      'if' => ((theme.nil? || theme[:menu][:print]) && !@view.is_alt_view?)},

    'full_screen' => {'text' => 'View Full Screen', 'class' => 'fullscreen',
      'href' => @view.href, 'external' => true,
      'if' => (theme.nil? || theme[:menu][:fullscreen])},

    'api' => {'text' => "Access this #{t(:blist_name).titleize} via the API...",
      'class' => 'api', 'href' => "/popup/api", 'modal' => !is_widget,
      'external' => is_widget, 'if' => (theme.nil? || theme[:menu][:api])},

    'subscribe' => {'text' => 'Subscribe to Updates', 'class' => 'subscribe',
      'href' => '#', 'if' => (theme.nil? ||
        theme[:menu][:subscribe].any?{ |key, value| value }),
      'submenu' =>
        {'class' => 'noicon', 'items' => [
          {'text' => 'via Atom', 'external' => true, 'class' => 'atom',
          'href' => "/views/#{view.id}/rows.atom",
          'if' => (theme.nil? || theme[:menu][:subscribe][:atom])},
          {'text' => 'via RSS', 'external' => true, 'class' => 'rss',
          'href' => "/views/#{view.id}/rows.rss",
          'if' => (theme.nil? || theme[:menu][:subscribe][:rss])}
      ]}},

    'analytics' => {'text' => (is_widget ? 'Advanced ' : '' ) +
      "#{t(:blist_name).titleize} Analytics...",
      'class' => 'adv_analytics statistics',
      'if' => (theme.nil? || theme[:menu][:adv_analytics]),
      'href' => "#{view.href}/stats",
      'external' => is_widget,
      'module_enabled' => 'advanced_metrics',
      'owner_item' => true,
      'upsell' => { 'href' => '/popup/stats', 'modal' => true }
      },

    'basic_analytics' => {'text' => "Basic #{t(:blist_name).titleize} Analytics...",
      'class' => 'basic_analytics statistics',
      'if' => (theme.nil? || theme[:menu][:basic_analytics]),
      'owner_item' => true,
      'href' => "#{view.href}/stats",
      'external' => !is_widget,
      'modal' => is_widget
      },

    'about' => {'text' => "About this #{t(:blist_name).titleize}...",
      'if' => (theme.nil? || theme[:menu][:about]),
      'class' => 'about', 'href' => "#{@view.href}/about", 'external' => is_widget},

    'email' => {'text' => "Email this #{t(:blist_name).titleize}...",
      'class' => 'email', 'href' => "#{@view.href}/email", 'modal' => true,
      'if' => (theme.nil? || theme[:menu][:email])},

    'publish' => {'text' => "Publish this #{t(:blist_name).titleize}...",
      'class' => 'publish', 'modal' => is_widget,
      'href' => (is_widget ?  "#{@view.href}/republish" : '#publish'),
      'if' => ((theme.nil? || theme[:menu][:republish]) &&
               @view.display.can_publish?)},

    'show_tags' => {'text' => "#{tag_show_hide.titleize} Row Tags",
      'class' => 'rowTags ungroupedOption',
      'if' => ((theme.nil? || theme[:menu][:show_tags]) && !view.is_alt_view? &&
               !view.is_grouped?),
      'href' => "##{tag_show_hide}-rowTags"},

    'more_views' => {'text' => 'More Views', 'class' => 'moreViews', 'href' => '#',
      'if' => ((theme.nil? || theme[:menu][:more_views]) && filters.length > 0),
      'submenu' => {'class' => 'scrollableMenu', 'items' => [
        {'button' => true, 'text' => 'Previous',
        'href' => '#prev', 'class' => 'prev'}] +
        filters.sort {|a,b| a.name <=> b.name }.map do |v|
        {'text' => v.name, 'href' => v.href, 'external' => is_widget,
        'class' => v.display.type + ' scrollable'}
      end + [{'button' => true, 'text' => 'Next',
      'href' => '#next', 'class' => 'next'}]}},

    'share' => {'text' => "Share this #{t(:blist_name).titleize}...",
      'class' => 'share', 'if' => @view.owned_by?(current_user) &&
        @view.parent_dataset.owned_by?(current_user) && !is_widget,
      'href' => "#share_#{@view.href}/share"},

    'delicious' => {'text' => 'Delicious', 'class' => 'delicious',
      'external' => true,
      'if' => (theme.nil? || theme[:menu][:socialize][:delicious]),
      'href' => "http://del.icio.us/post?url=#{seo_path}&title=#{h(view.name)}"},

    'digg' => {'text' => 'Digg', 'class' => 'digg', 'external' => true,
      'if' => (theme.nil? || theme[:menu][:socialize][:digg]),
      'href' => "http://digg.com/submit?phase=2&url=#{seo_path}&title=#{h(view.name)}"},

    'facebook' => {'text' => 'Facebook', 'class' => 'facebook', 'external' => true,
      'if' => (theme.nil? || theme[:menu][:socialize][:facebook]),
      'href' => "http://www.facebook.com/share.php?u=#{h(seo_path)}"},

    'twitter' => {'text' => 'Twitter', 'class' => 'twitter', 'external' => true,
      'if' => (theme.nil? || theme[:menu][:socialize][:twitter]),
      'href' => "http://www.twitter.com/home?status=#{tweet + short_path}"}
    }

    # TODO: Content disposition and suggested filename
    if @view.is_blobby?
      options['download'] =  {'text' => 'Download', 'class' => 'export',
        'href' => @view.blob_href, 'fullscreen' => true}
    else
      options['download'] = {'text' => 'Download this ' + t(:blist_name).titleize,
        'if' => (theme.nil? ||
          theme[:menu][:download_menu].any?{ |key, value| value }),
        'class' => 'export', 'href' => '#', 'submenu' =>
          {'class' => 'noicon', 'items' => [
            {'text' => 'as CSV', 'external' => true, 'class' => 'csv',
            'link_class' => is_widget ? 'noInterstitial' : '',
            'if' => (theme.nil? || theme[:menu][:download_menu][:csv]),
            'href' => "/views/#{view.id}/rows.csv?accessType=DOWNLOAD"},
            {'text' => 'as JSON', 'external' => true, 'class' => 'json',
            'link_class' => is_widget ? 'noInterstitial' : '',
            'if' => (theme.nil? || theme[:menu][:download_menu][:json]),
            'href' => "/views/#{view.id}/rows.json?accessType=DOWNLOAD"},
            {'text' => 'as PDF', 'external' => true, 'class' => 'pdf',
            'link_class' => is_widget ? 'noInterstitial' : '',
            'if' => (theme.nil? || theme[:menu][:download_menu][:pdf]),
            'href' => "/views/#{view.id}/rows.pdf?accessType=DOWNLOAD"},
            {'text' => 'as XLS', 'external' => true, 'class' => 'xls',
            'link_class' => is_widget ? 'noInterstitial' : '',
            'if' => (theme.nil? || theme[:menu][:download_menu][:xls]),
            'href' => "/views/#{view.id}/rows.xls?accessType=DOWNLOAD"},
            {'text' => 'as XLSX (beta)', 'external' => true, 'class' => 'xlsx',
            'link_class' => is_widget ? 'noInterstitial' : '',
            'if' => (theme.nil? || theme[:menu][:download_menu][:xlsx]),
            'href' => "/views/#{view.id}/rows.xlsx?accessType=DOWNLOAD"},
            {'text' => 'as XML', 'external' => true, 'class' => 'xml',
            'link_class' => is_widget ? 'noInterstitial' : '',
            'if' => (theme.nil? || theme[:menu][:download_menu][:xml]),
            'href' => "/views/#{view.id}/rows.xml?accessType=DOWNLOAD"}
          ]}}
    end

    options.merge({
    'socialize' => {'text' => "Socialize this #{t(:blist_name).titleize}",
      'if' => (theme.nil? || theme[:menu][:socialize].any?{ |key, value| value }),
      'class' => 'socialize', 'href' => '#', 'submenu' =>
        {'class' => 'socializeMenu', 'option_menu' => true,
        'items' => socialize_menu_options(view, options)}}})
  end

  def share_menu_options(view, menu_options = nil)
    menu_options ||= dataset_menu_lookup(view)

    [menu_options['publish'],
      menu_options['email'],
      menu_options['separator'],
      menu_options['share'],
      menu_options['separator'],
      menu_options['socialize']
    ]
  end

  def socialize_menu_options(view, menu_options = nil)
    menu_options ||= dataset_menu_lookup(view)

    [menu_options['delicious'],
      menu_options['digg'],
      menu_options['facebook'],
      menu_options['twitter']]
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
        'This dataset does not have the appropriate columns for visualizations')},
      {'text' => 'Form', 'href' => "#{view.href}/form",
      'if' => !view.is_grouped? && CurrentDomain.user_can?(current_user, :create_datasets) &&
               module_available?(:form_publish) &&
               view.owned_by?(@current_user) &&
               view.parent_dataset.owned_by?(@current_user),
      'class' => 'form' + (view.can_add_form? ? '' : ' disabled'),
      'title' => (view.can_add_form? ? '' :
        'This dataset does not have any visible columns')},
      {'text' => 'Map', 'href' => "#{view.href}/map",
      'if' => !view.is_grouped? && CurrentDomain.member?(current_user) &&
               module_available?(:map_publish),
      'class' => 'map' + (view.can_add_map? ? '' : ' disabled'),
      'title' => (view.can_add_map? ? '' :
        'This dataset does not have the appropriate columns')}
    ]
  end

  def filter_submenu(view, is_widget = false, menu_options = nil)
    menu_options ||= dataset_menu_lookup(view)

    [menu_options['show_tags']] +
      (is_widget ? [] : [
      {'text' => 'Column Totals', 'class' => 'columnTotals ungroupedOption',
      'if' => !view.is_alt_view? && !view.is_grouped?,
      'owner_item' => true,
      'href' => '#', 'submenu' => columns_menu(view,
        {'href_prefix' => "#column_totals:", 'include_options' =>
          {'nested_table_children' => true, 'list' => true},
        'initial_items' => [{'section_title' => 'Add totals to:'},
          menu_options['separator']],
        'submenu' => method(:column_aggregate_menu),
        'column_test' => proc {|c, p| c.possible_aggregates.length > 1}})},
      menu_options['separator'],
      {'text' => 'Filter...', 'class' => 'filter', 'if' => !view.is_alt_view?,
      'href' => blist_filters_path(view.id), 'modal' => true},
      {'text' => 'Sort Columns...', 'class' => 'sort', 'if' => !view.is_alt_view?,
      'href' => '#sort_' + blist_sort_bys_path(view.id)},
      {'text' => 'Roll Ups & Drill Downs...', 'class' => 'grouping',
      'if' => !view.is_alt_view?,
      'href' => '#group_' + blist_groupings_path(view.id)},
      {'text' => 'Show or Hide Columns', 'class' => 'showHide ungroupedOption',
      'href' => '#', 'if' => !view.is_alt_view?, 'submenu' => columns_menu(view,
        {'initial_items' => [{'section_title' => 'Check/Uncheck to Show/Hide'},
          menu_options['separator']],
          'post_items' => (current_user && view.owner.id == current_user.id) ?
            [menu_options['separator'],
          {'text' => 'Advanced...', 'class' => 'advancedShowHide',
          'href' => blist_show_hides_path(view.id), 'modal' => true}] : [],
          'href_prefix' => "#hide-show-col_", 'checkbox_menu' => true,
          'checkbox_callback' => proc { |c| !c.flag?('hidden') },
          'column_test' => proc {|c, p| (p.nil? || !p.flag?('hidden')) &&
            (!view.is_grouped? || c.is_group_aggregate? || c.is_grouped?(view))},
          'include_options' =>
            {'nested_table' => true, 'hidden' => true,
            'nested_table_children' => true, 'list' => true}
            })},
      menu_options['separator'],
      {'text' => 'Create a Calendar View...', 'href' => "#{view.href}/calendar",
      'if' => !view.is_alt_view?, 'user_required' => true,
      'class' => 'calendar mainViewOption' +
        (view.can_add_calendar? ? '' : ' disabled'),
      'title' => (view.can_add_calendar? ? '' :
        'This dataset does not have both a date column and text column')},
      {'text' => 'Create a Chart View...', 'href' => "#{view.href}/visualization",
      'if' => !view.is_alt_view?, 'user_required' => true,
      'class' => 'visualization mainViewOption' +
        (view.can_add_visualization? ? '' : ' disabled'),
      'title' => (view.can_add_visualization? ? '' :
        'This dataset does not have the appropriate columns for visualizations')},
      {'text' => 'Create a Form View...', 'href' => "#{view.href}/form",
      'if' => !view.is_alt_view? && !view.is_grouped? &&
        (CurrentDomain.user_can?(current_user, :create_datasets) && module_available?(:form_publish) &&
         view.owned_by?(@current_user) &&
         view.parent_dataset.owned_by?(@current_user)),
      'user_required' => true, 'class' => 'form mainViewOption' +
        (view.can_add_form? ? '' : ' disabled'),
      'title' => (view.can_add_form? ? '' :
        'This dataset does not have any visible columns')},
      {'text' => 'Create a Map...', 'href' => "#{view.href}/map",
      'if' => !view.is_alt_view? && !view.is_grouped? &&
        CurrentDomain.member?(current_user) && module_available?(:map_publish),
      'user_required' => true, 'class' => 'map mainViewOption' +
        (view.can_add_map? ? '' : ' disabled'),
      'title' => (view.can_add_map? ? '' :
        'This dataset does not have the appropriate columns')}
      ]) + [menu_options['separator'],
      menu_options['more_views']]
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
    has_columns = false

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
          cur_item = {'text' => h(c.name + (args['text_postfix'] || '')),
            'modal' => modal,
            'href' => args['href_prefix'] + c.id.to_s,
            'class' => get_datatype_class(c) + ' scrollable' +
              (args['checkbox_callback'] &&
               args['checkbox_callback'].call(c) ? ' checked' : '')}
          if (args['submenu'])
            cur_item['submenu'] = args['submenu'].call(c)
          end
          items << cur_item
          has_columns = true
        end

        # If we are displaying nested table children, loop through those (and
        # again check for visibility for each child)
        if c.is_nested_table && !c.is_list &&
          include_options['nested_table_children']
          (c.childColumns || []).each do |cc|
            if (!cc.flag?('hidden') || include_options['hidden']) &&
              (!args['column_test'] || args['column_test'].call(cc, c))
              cur_item = {'text' => h(c.name + ': ' +
                cc.name + (args['text_postfix'] || '')),
                'modal' => modal,
                'href' => args['href_prefix'] + cc.id.to_s,
                'class' => get_datatype_class(cc) + ' scrollable' +
                  (args['checkbox_callback'] &&
                   args['checkbox_callback'].call(cc) ? ' checked' : '')}
              if (args['submenu'])
                cur_item['submenu'] = args['submenu'].call(cc)
              end
              items << cur_item
              has_columns = true
            end
          end
        end
      end
    end

    items.push({'button' => true, 'text' => 'Next',
      'href' => '#next', 'class' => 'next'})

    items = (args['initial_items'] || []) + items + (args['post_items'] || [])

    {'id' => args['id'], 'class' => 'columnsMenu',
      'items' => has_columns ? items : [], 'checkbox_menu' => args['checkbox_menu']}
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
    dtt = column.renderTypeName.downcase
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
      {'items' => View.find_recent(num_recent + 1).
        reject {|v| v.id == cur_view.id}.slice(0, num_recent).map do |v|
          {'text' => v.name, 'href' => v.href, 'class' => v.display.type}
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
  
  def merged_license_select_options(selected_license = nil)
    options_for_select(View.merged_licenses.invert.sort { |a, b| a.first <=> b.first }, selected_license)
  end
  
  def font_unit_select_options(selected_unit = nil)
    options_for_select({'ems' => 'em', 'points' => 'pt', 'pixels' => 'px', 'inches' => 'in'}, selected_unit)
  end

  def images_select_options(selected_image = nil)
    image_options = [['None', 'none'], ['Socrata', 'default'], ['Upload a New Logo...', 'upload']]
    images = Asset.find(:type => "WIDGET_CUSTOMIZATION_LOGO")
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
    tracking_params = { :cur => ActiveSupport::SecureRandom.base64(9).slice(0..10).gsub(/\//, '-').gsub(/\+/, '_') }
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
                      "title=\"#{view.name}\" " +
                      "height=\"#{options[:dimensions][:height]}px\" src=\"#{root_path}" +
                      "/widgets/#{view.id}/#{variation.blank? ? 'normal' : variation}?" +
                      "#{tracking_params.to_param}\" frameborder=\"0\" scrolling=\"#{!view.display.can_publish? || view.display.scrolls_inline? ? 'no' : 'auto'}\">" +
                      "<a href=\"#{root_path + view.href}\" title=\"#{h(view.name)}\" " +
                      "target=\"_blank\">#{h(view.name)}</a></iframe>"
    if options[:show_powered_by]
      embed_template += "<p><a href=\"http://www.socrata.com/\" target=\"_blank\">" +
        "Powered by Socrata</a></p>"
    end
    embed_template += "</div>"
  end
  
  def options_for_limit_to(column, current = nil)
    options = [['No Filter', '']]
    options += column.possible_filter_conditions.
      collect{|c_hash| [c_hash[:label], c_hash[:operator]]}
    options_for_select(options, current)
  end
  
  def options_for_sort_by(columns, current = nil)
    options = [['No Sort', '']]
    options += columns.select{|c| c.is_sortable?}.
      collect{|column| [column.name, column.id]}
    options_for_select(options, current)
  end

  # Create a drop down menu of formatting fonts
  # Pass a font name to select it by default.
  # TODO: This sucks keeping it in sync with our text editor; better place to
  # code this?
  def font_select_options(selected_font = nil)
    out = ""
    {'Helvetica' => 'helvetica,arial,sans serif',
      'Courier' => 'courier,monospace',
      'Times' => 'times,serif'
    }.sort { |a,b| a[0] <=> b[0] }.each do |font|
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

  safe_helper :get_blist_rating_html, :get_comment_rating_html,
    :get_publish_embed_code_for_view
end
