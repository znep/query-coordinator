class Administration::ConnectorController < AdministrationController
  include DataConnectorHelper

  #
  # Connector / DataConnector (formerly known as external federation)
  #

  before_filter :only => [:connectors, :new_connector, :delete_connector, :create_connector, :edit_connector, :update_connector] {|c| c.check_auth_level(UserRights::VIEW_ALL_DATASET_STATUS_LOGS)}
  before_filter :only => [:connectors, :new_connector, :delete_connector, :create_connector, :edit_connector, :update_connector, :show_connector] {|c| c.check_feature_flag('enable_catalog_connector')}

  def connectors
    begin
      @connectors = DataConnector.servers
      @failed_esri_connection = false
    rescue EsriCrawler::ServerError => error
      display_external_error(error, :connectors)
    rescue StandardError => ex
      Rails.logger.error("Encountered error while trying to access Esri Crawler Service: #{ex}")
      flash[:notice] = t('screens.admin.connector.service_unavailable')
      @failed_esri_connection = true
    end
  end

  def new_connector
    @server = {}
  end

  def create_connector
    @server = params[:server] || {}
    begin
      response = DataConnector.create(params[:server][:esri_domain])
    rescue EsriCrawler::ServerError => error
      return display_external_error(error, :new_connector)
    rescue StandardError => error
      handle_failed_connection(error)
    end

    respond_to do |format|
      format.html do
        flash[:notice] = t('screens.admin.connector.flashes.created')
        redirect_to :action => :connectors
      end
      format.data { render :json => { :success => true } }
    end
  end

  def edit_connector
    @sync_types = Hash[['ignore', 'catalog', 'data'].map do |k|
      [t("screens.admin.connector.#{k}"), k]
    end]
    begin
      @tree = DataConnector.tree(params[:server_id])
      @server = DataConnector.server(params[:server_id])
    rescue EsriCrawler::ResourceNotFound => error
      flash[:error] = t('screens.admin.connector.flashes.server_not_found')
      redirect_to :action => :connectors
    rescue EsriCrawler::ServerError => error
      display_external_error(error, :connectors)
    rescue StandardError => error
      handle_failed_connection(error)
    end
  end

  def update_connector
    begin
      @response = DataConnector.update_server(params[:server_id], params['server'])
      @server = DataConnector.server(params[:server_id])
      @tree = DataConnector.tree(params[:server_id])
    rescue EsriCrawler::ServerError => error
      return display_external_error(error, :edit_connector)
    rescue EsriCrawler::ResourceNotFound => error
      flash[:error] = t('screens.admin.connector.flashes.server_not_found')
      redirect_to :action => :connectors
    rescue StandardError => error
      handle_failed_connection(error)
    end
    respond_to do |format|
      format.html do
        flash[:notice] = t('screens.admin.connector.flashes.updated')
        redirect_to :action => :edit_connector
      end
      format.data { render :json => { :success => true } }
    end
  end

  def delete_connector
    begin
      @response = DataConnector.delete_server(params[:server_id])
      respond_to do |format|
        format.html do
          flash[:notice] = t('screens.admin.connector.flashes.deleted')
          redirect_to :action => :connectors
        end
        format.data { render :json => { :success => true } }
      end
    rescue EsriCrawler::ResourceNotFound => error
      flash[:error] = t('screens.admin.connector.flashes.server_not_found')
      redirect_to :action => :connectors
    rescue EsriCrawler::ServerError => error
      return display_external_error(error, :connectors)
    rescue StandardError => error
      handle_failed_connection(error)
    end
  end

  # If esri_crawler_http is unreachable.
  # Redirecting to /connectors will log an error if the service is still down.
  def handle_failed_connection(error)
    flash[:notice] = t('screens.admin.connector.service_unavailable')
    redirect_to :action => :connectors
  end

  def display_external_error(error, redirection)
    begin
      reason = error.body['error']['reason']
      params = error.body['error']['params'].symbolize_keys
      flash[:error] = t("screens.admin.connector.errors.#{reason}") % params
    rescue
      flash[:error] = t("screens.admin.connector.errors.problem_with_errors")
    end
    redirect_to :action => redirection
  end

  def show_connector
    page_size = 50
    all_threshold = 8
    page_idx = params.fetch(:page, '1').to_i
    offset = (page_idx - 1) * page_size

    begin
      @server = DataConnector.server(params[:server_id])
      layer_resp = DataConnector.all_layers(params[:server_id], offset, page_size)
      @layers = layer_resp['items']
      count = layer_resp['count']
    rescue EsriCrawler::ResourceNotFound => error
      flash[:error] = t('screens.admin.connector.flashes.server_not_found')
      redirect_to :action => :connectors
    rescue EsriCrawler::ServerError => error
      return display_external_error(error, :connectors)
    rescue StandardError => error
      handle_failed_connection(error)
    end

    @pager_elements = Pager::paginate(count, page_size, page_idx, { :all_threshold => all_threshold, :params => {} })


  end

end
