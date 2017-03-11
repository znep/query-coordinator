module PageTypeHelper
  QUERY_PARAM_TO_PAGE_TYPE = {
    'order' => 'sort',
    'group' => 'grouped',
    'where' => 'filter',
    'having' => 'filter'
  }

  def page_type_with_conditional_embed(request)
    "#{'embed-' if embed?(request)}#{page_type(request)}"
  end

  def embed?(request)
    request.params[:cur].present?
  end

  def url_host(url)
    URI(url).host
  end

  def page_type(request)
    controller, action, id = path_info(request).values_at(:controller, :action, :id)

    return 'homepage' if /^\/([a-z]{2})?\/?$/.match(request.path)

    case controller
      when /^administration.*$/
        'admin'
      when 'custom_content'
        'dataslate'
      when 'profile'
        'profile'
      when 'browse'
        if request.params.has_key?('q')
          'browse-search'
        else
          'browse'
        end
      when 'govstat'
        'govstat-admin'
      when 'odysseus'
        'govstat'
      when 'datasets'
        return 'other' unless id.present?

        view = get_view_or_nil(id)

        return 'other' if view.nil?

        json_query = view.metadata.json_query

        return 'dataset' if json_query.nil? || json_query.empty?

        query_contains = QUERY_PARAM_TO_PAGE_TYPE.map do |key, value|
          value if json_query.has_key?(key)
        end.compact

        return 'dataset-complex' if query_contains.length > 1

        "dataset-#{query_contains[0]}"
      when 'data_lens'
        'newux'
      else
        'other'
    end
  end

  def get_view_or_nil(id)
    ::View.find(id)
  rescue CoreServer::ResourceNotFound
    logger.debug('This dataset or view cannot be found, or has been deleted.')
    nil
  rescue CoreServer::CoreServerError => e
    if e.error_code == 'authentication_required'
      logger.debug('Authentication required to access this dataset')
    elsif e.error_code == 'permission_denied'
      logger.debug('Permission denied to access this dataset')
    else
      logger.debug("Error getting view from core: #{e.error_message}")
    end
    nil
  end

  def path_info(request)
    Rails.application.routes.recognize_path(request.url)
  end
end
