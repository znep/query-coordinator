# helper for logic around displaying connector pages
module DataConnectorHelper

  # private :get_service_display_string

  # for a service hash, get the most preferred way to represent it as a string
  def service_display_string(service_data)
    display_string = get_service_display_string(service_data)
    return service_data['url'] if display_string.blank?
    return "#{display_string} (#{service_data['kind'].titleize})"
  end

  def get_service_display_string(service_data)
    return service_data['name'] unless service_data['name'].blank?
    return service_data['service_description'] unless service_data['service_description'].blank?
    return service_data['description'] unless service_data['description'].blank?
    return ''
  end

  def layer_display_string(layer_data)
    return layer_data['name'] unless layer_data['name'].blank?
    layer_data['url']
  end

  # get the suffix for an icon representing a connector's sync state
  # ex: icon-check is a check symbol
  def connector_icon(status)
    case status
      when 'failed' then 'failed'
      when 'success' then 'check'
      when 'not_yet' then 'waiting'
    end
  end

  def sync_type_icon(sync_type)
    case sync_type
      when 'ignored' then 'icon-plus3'
      when 'data' then 'icon-data'
      when 'catalog' then 'icon-external-square'
    end
  end

  # Constructs the 'name' values of the checkbox input field
  def folder_param_name(folder)
    "server[folders][#{folder['id']}]"
  end

  def service_param_name(folder, service)
    "#{folder_param_name(folder)}[services][#{service['id']}]"
  end

  def layer_param_name(folder, service, layer)
    "#{service_param_name(folder, service)}[layers][#{layer['id']}]"
  end

  # Constructs the filterable term attached to each checkbox field
  def folder_search_term(folder)
    folder['name']
  end

  def service_search_term(folder, service)
    "#{service_display_string(service)} #{folder_search_term(folder)}"
  end

  def layer_search_term(folder, service, layer)
    "#{layer_display_string(layer)} #{service_search_term(folder, service)}"
  end

  def option_disabled?(server)
    server.federate_all? || server.data_connect_all?
  end

  def disabled_class(server)
    option_disabled?(server) ? "is-disabled" : ""
  end

  def icon_for_asset(server, asset)
    content_tag(
      :span,
      "",
      class: "select-icon #{sync_type_icon(asset['sync_type'])} " + disabled_class(server),
      id: "icon-for-#{asset['id']}"
    )
  end

  def select_tag_choices
    {t("screens.admin.connector.data_option") => 'data',
    t("screens.admin.connector.catalog_option") => 'catalog',
    t("screens.admin.connector.ignored_option") => 'ignored'}
  end

  # Constructs the check_boxes for the edit_connector page.
  def folder_check_box(server, folder)
    check_box(
      folder_param_name(folder),
      'sync_type',
      {
        :checked => folder['sync_type'] == 'catalog',
        :value => folder['sync_type'],
        :class => 'sync-type sync-type-check',
        :disabled => option_disabled?(server),
        :data => {
          :parent => 'server',
          :type => 'folder',
          :parent_id => server.id,
          :id => folder['id'],
          :term => folder_search_term(folder)
        }
      }, 'catalog', 'ignored'
    )
  end

  def folder_select_tag(server, folder)
    select_tag(
      "#{folder_param_name(folder)}[sync_type]",
      options_for_select(select_tag_choices, folder['sync_type']),
      {
        :value => folder['sync_type'],
        :class => "sync-type sync-type-select #{folder['sync_type']}-selected",
        :disabled => option_disabled?(server),
        :data => {
          :parent => 'server',
          :type => 'folder',
          :parent_id => server.id,
          :id => folder['id'],
          :term => folder_search_term(folder)
        }
      }
    )
  end

  def service_check_box(server, folder, service)
    check_box(
      service_param_name(folder, service),
      'sync_type',
      {
        :checked => service['sync_type'] == 'catalog',
        :value => service['sync_type'],
        :class => 'sync-type sync-type-check',
        :disabled => option_disabled?(server),
        :data => {
          :parent => 'folder',
          :type => 'service',
          :parent_id => folder['id'],
          :id => service['id'],
          :term => service_search_term(folder, service)
        }
      }, 'catalog', 'ignored'
    )
  end

  def service_select_tag(server, folder, service)
    select_tag(
      "#{service_param_name(folder, service)}[sync_type]",
      options_for_select(select_tag_choices, service['sync_type']),
      {
        :value => service['sync_type'],
        :class => "sync-type sync-type-select #{service['sync_type']}-selected",
        :disabled => option_disabled?(server),
        :data => {
          :parent => 'folder',
          :type => 'service',
          :parent_id => folder['id'],
          :id => service['id'],
          :term => service_search_term(folder, service)
        }
      }
    )
  end

  def layer_check_box(server, folder, service, layer)
    check_box(
      layer_param_name(folder, service, layer),
      'sync_type',
      {
        :checked => layer['sync_type'] == 'catalog',
        :value => layer['sync_type'],
        :class => 'sync-type sync-type-check',
        :disabled => option_disabled?(server),
        :data => {
          :parent => 'service',
          :type => 'layer',
          :parent_id => service['id'],
          :id => layer['id'],
          :term => layer_search_term(folder, service, layer)
        }
      }, 'catalog', 'ignored'
    )
  end

  def layer_select_tag(server, folder, service, layer)
    select_tag(
      "#{layer_param_name(folder, service, layer)}[sync_type]",
      options_for_select(select_tag_choices, layer['sync_type']),
      {
        :value => layer['sync_type'],
        :class => "sync-type sync-type-select #{layer['sync_type']}-selected",
        :disabled => option_disabled?(server),
        :data => {
          :parent => 'service',
          :type => 'layer',
          :parent_id => service['id'],
          :id => layer['id'],
          :term => layer_search_term(folder, service, layer)
        }
      }
    )
  end
end
