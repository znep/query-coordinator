# helper for logic around displaying connector pages
module DataConnectorHelper

  # for a service hash, get the most preferred way to represent it as a string
  def service_display_string(service_data)
    return service_data['name'] unless service_data['name'].blank?
    return service_data['service_description'] unless service_data['service_description'].blank?
    return service_data['description'] unless service_data['description'].blank?
    service_data['url']
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

  # Constructs the check_boxes for the edit_connector page.
  def folder_check_box(server, folder)
    check_box(
      folder_param_name(folder),
      'sync_type',
      {
        :checked => folder['sync_type'] == 'catalog',
        :value => folder['sync_type'],
        :class => 'sync-type',
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

  def service_check_box(folder, service)
    check_box(
      service_param_name(folder, service),
      'sync_type',
      {
        :checked => service['sync_type'] == 'catalog',
        :value => service['sync_type'],
        :class => 'sync-type',
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

  def layer_check_box(folder, service, layer)
    check_box(
      layer_param_name(folder, service, layer),
      'sync_type',
      {
        :checked => layer['sync_type'] == 'catalog',
        :value => layer['sync_type'],
        :class => 'sync-type',
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
end
