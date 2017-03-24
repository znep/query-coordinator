class DataConnector
  include DataConnectorHelper

  def self.servers
    query = {
      :filters => {
        :socrata_domain => CurrentDomain.cname
      }
    }
    server_hashes = EsriCrawler.get_request('/servers', query)['items']
    server_hashes.map { |server_hash| EsriServer.new(server_hash) }
  end

  # get information around a single server
  def self.server(id)
    query = {
      :filters => {
        :socrata_domain => CurrentDomain.cname
      }
    }
    EsriServer.new(EsriCrawler.get_request("/servers/#{id}", query))
  end

  # get a nested json blob of all data associated with the server
  # at all layers: server, folders, services, layers, fields
  # also get a 'most_recent_job' if there is one
  def self.tree(id)
    EsriCrawler.get_request("/servers/#{id}/tree")
  end

  def self.all_layers(id, offset, limit)
    query = {
      :rejects => {
        :fourfour => 'null'
      },
      :offset => offset,
      :limit => limit

    }
    return EsriCrawler.get_request("/servers/#{id}/layers", query)
  end

  # create a new connector by posting it to the EsriCrawler
  def self.create(esri_domain, sync_type = 'ignored')
    EsriCrawler.post_request('/servers', {
      :url => "https://#{esri_domain}",
      :sync_type => sync_type,
      :socrata_domain => CurrentDomain.cname,
      :domain_id => CurrentDomain.domain.id
    })
  end

  def self.delete_server(id)
    EsriCrawler.delete_request("/servers/#{id}")
  end

  # the updatable attribute for a connected server here is going to be the 'sync_type'
  # catalog => 1 for an object means that all its children layers should be created as catalog datasets
  # the method switches string ids to ints and sets them under the 'id' key in arrays
  def self.update_server(id, params)
    to_models = lambda do |checkboxes, path|
      path = path.clone
      child_name = path.shift

      # checkboxes is a nested hash filled with the catalog state for the connected server object structure
      # ex: (where 19 is the id of a folder, 5 of a service, 30 and 4 as ids of layers)
      # {'19' => {
      #   'sync_type' => 'ignored',
      #   'services' => {
      #      '5' => {
      #        'sync_type' => 'catalog',
      #        'layers' => {
      #          '30' => {'sync_type' => 'catalog'},
      #          '4' => {'sync_type => 'catalog'}}}}}}
      checkboxes.map do |id, catalog_state|
        model = {
          'id' => id.to_i,
          'sync_type' => catalog_state['sync_type']
        }
        if child_name.present? && catalog_state[child_name].present?
          model[child_name] = to_models.call(catalog_state[child_name], path)
        end
        model
      end
    end
    folder_checkboxes = params['folders'] || []
    body = {
      'sync_type' => params['sync_type'],
      'folders' => to_models.call(folder_checkboxes, ['services', 'layers'])
    }
    EsriCrawler.patch_request("/servers/#{id}/tree", body)
  end
end
