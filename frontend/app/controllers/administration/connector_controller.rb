class Administration::ConnectorController < AdministrationController

  include DataConnectorHelper
  include ActionView::Helpers::SanitizeHelper
  include Administration::ConnectorHelper

  #
  # Connector / EsriServerConnector / CatalogFederatorConnector
  #

  before_filter :only =>
    %i(connectors new_connector delete_connector create_connector edit_connector update_connector) do |c|
      c.check_auth_level(UserRights::USE_DATA_CONNECTORS)
    end

  before_filter :fetch_server, :only => [:edit_connector, :update_connector, :show_connector]
  before_filter :fetch_connectors, :only => [:connectors, :update_connector]

  def connectors # index
  end

  def new_connector
    @server = {}
  end

  def create_connector
    @server = params[:server] || {}
    if @server['federation_source'] == 'data_json'
      unless params[:server][:source_url].downcase.ends_with?('data.json')
        (errors ||= []) << t('screens.admin.connector.errors.url_must_end_in_data_json')
      end
      if params[:server][:display_name].blank?
        (errors ||= []) << t('screens.admin.connector.errors.display_name_is_required')
      end
      if errors.present?
        flash.now[:error] = errors.join(' ')
        return render :new_connector
      end

      begin
        response = CatalogFederatorConnector.create(params[:server])
        success_notice = t('screens.admin.connector.flashes.created_data_json')
      rescue StandardError => error
        # Catalog federator service transforms the 400 returned by core into a 500, so we match the text.
        if error.message.match(/source already exists/)
          flash[:error] = t('screens.admin.connector.flashes.server_already_exists')
          return redirect_to :connectors
        end
        return display_external_error(error, :new_connector)
      end
    else
      if params[:server][:source_url].blank?
        flash.now[:error] = t('screens.admin.connector.errors.url_cannot_be_blank')
        return render :new_connector
      end

      begin
        response = EsriServerConnector.create(params[:server][:source_url])
        success_notice = t('screens.admin.connector.flashes.created')
      rescue EsriCrawler::ServerError => error
        return display_external_error(error, :new_connector)
      rescue StandardError => error
        return handle_failed_connection_and_redirect(error)
      end
    end

    respond_to do |format|
      format.html do
        flash[:notice] = success_notice
        redirect_to :connectors
      end
      format.data { render :json => { :success => true } }
    end
  end

  def edit_connector
  end

  def update_connector
    if esri_arcgis?
      begin
        # Note! The implementation of the EsriServerConnector is intimately tied to the params hash structure.
        @response = EsriServerConnector.update_server(params[:server_id], params[:server])
      rescue EsriCrawler::ServerError => error
        return display_external_error(error, :edit_connector)
      rescue EsriCrawler::ResourceNotFound => error
        flash[:error] = t('screens.admin.connector.flashes.server_not_found')
        return redirect_to :connectors
      rescue StandardError => error
        return handle_failed_connection_and_redirect(error)
      end

      flash[:notice] = t('screens.admin.connector.flashes.updated')
      return redirect_to :connectors
    else
      begin
        CatalogFederator.client.set_sync_policy(params[:server_id], params[:server][:sync_policy])
        if params[:server][:sync_policy] == 'all'
          CatalogFederator.client.sync_datasets(params[:server_id], selection_diff(all_assets: true))
        else
          CatalogFederator.client.sync_datasets(params[:server_id], selection_diff)
        end
        flash[:notice] = t('screens.admin.connector.flashes.updated')
        return redirect_to :connectors
      rescue => error
        flash[:warning] = t('screens.admin.connector.flashes.update_failed')
        return redirect_to :connectors
      end

      flash[:notice] = t('screens.admin.connector.flashes.updated')
      return redirect_to :connectors
    end
  end

  def delete_connector
    begin
      if esri_arcgis?
        response = EsriServerConnector.delete_server(params[:server_id])
      else
        response = CatalogFederatorConnector.delete(params[:server_id])
      end
      respond_to do |format|
        format.html do
          flash[:notice] = t('screens.admin.connector.flashes.deleted')
          return redirect_to :connectors
        end
        format.data { render :json => { :success => true } }
      end
    rescue EsriCrawler::ResourceNotFound => error
      flash[:error] = t('screens.admin.connector.flashes.server_not_found')
      return redirect_to :connectors
    rescue EsriCrawler::ServerError => error
      return display_external_error(error, :connectors)
    rescue StandardError => error
      return handle_failed_connection_and_redirect(error)
    end
  end

  # If esri_crawler_http is unreachable.
  # Redirecting to /connectors will log an error if the service is still down.
  def handle_failed_connection_and_redirect(error)
    flash[:warning] = t('screens.admin.connector.service_unavailable')
    redirect_to :connectors
  end

  def display_external_error(error, redirection = nil)
    begin
      reason = error.body['error']['reason']
      params = error.body['error']['params'].symbolize_keys
      flash[:error] = t("screens.admin.connector.errors.#{reason}") % params
    rescue
      flash[:error] = t('screens.admin.connector.errors.problem_with_errors')
    end
    redirect_to redirection if redirection.present?
  end

  def show_connector
    # Show page currently only supported for Esri connectors
    if esri_arcgis?
      page_size = 50
      all_threshold = 8
      page_idx = params.fetch(:page, '1').to_i
      offset = (page_idx - 1) * page_size

      begin
        layer_resp = EsriServerConnector.all_layers(params[:server_id], offset, page_size)
        @layers = layer_resp['items']
        count = layer_resp['count']
      rescue EsriCrawler::ResourceNotFound => error
        flash[:error] = t('screens.admin.connector.flashes.server_not_found')
        return redirect_to :connectors
      rescue EsriCrawler::ServerError => error
        return display_external_error(error, :connectors)
      rescue StandardError => error
        return handle_failed_connection_and_redirect(error)
      end

      @pager_elements = Pager::paginate(count, page_size, page_idx, :all_threshold => all_threshold, :params => {})
    else
      redirect_to :edit_connectors
    end
  end

  private

  def fetch_connectors
    @esri_connectors = []
    begin
      @esri_connectors = EsriServerConnector.servers
    rescue EsriCrawler::ServerError => error
      @failed_esri_connection = true
      add_flash(:error, t('screens.admin.connector.esri_service_unavailable'))
      display_external_error(error)
    rescue => ex
      @failed_esri_connection = true
      add_flash(:error, t('screens.admin.connector.esri_service_unavailable'))
      Rails.logger.error("Encountered error while trying to access Esri Crawler service: #{ex}")
    end

    if enable_catalog_federator_connector?
      begin
        @catalog_federator_connectors = CatalogFederatorConnector.servers
      rescue => ex
        @failed_catalog_federator_connection = true
        add_flash(:error, t('screens.admin.connector.catalog_federator_service_unavailable'))
        Rails.logger.error("Encountered error while trying to access Catalog Federator service: #{ex}")
      end
      if @catalog_federator_connectors.blank?
        add_flash(:warning, t('screens.admin.connector.no_catalog_federator_connectors'))
      end
    end
  end

  def fetch_server
    if esri_arcgis?
      begin
        @tree = EsriServerConnector.tree(params[:server_id])
        @server = EsriServerConnector.server(params[:server_id])
      rescue EsriCrawler::ResourceNotFound => error
        flash[:error] = t('screens.admin.connector.flashes.server_not_found')
      rescue EsriCrawler::ServerError => error
        display_external_error(error)
      rescue => error
        flash[:warning] = t('screens.admin.connector.esri_service_unavailable')
      end
    else
      if enable_catalog_federator_connector?
        begin
          @server = CatalogFederatorConnector.servers.detect { |server| server.id.to_i == params[:server_id].to_i }
          @datasets = CatalogFederator.client.get_datasets(@server.id).sort_by { |item| item['name'] }
        rescue => e
          add_flash(:error, t('screens.admin.connector.errors.json_format_error'))
          return redirect_to :connectors
        end
      end
    end

    unless @server.present?
      add_flash(:warning, t('screens.admin.connector.errors.unknown_server'))
      redirect_to :connectors
    end
  end

  def enable_catalog_federator_connector?
    @enable_catalog_federator_connector = @enable_catalog_federator_connector.nil? ?
      FeatureFlags.derive(nil, request).enable_catalog_federator_connector : @enable_catalog_federator_connector
  end
  helper_method :enable_catalog_federator_connector?

  def selection_diff(all_assets: false)
    selected_assets = all_assets ? @datasets : @datasets.values_at(*params[:server][:assets].map(&:to_i))
    {
      'addedSelections': selected_assets.pluck('externalId'),
      'removedSelections': (@datasets - selected_assets).pluck('externalId')
    }
  end

end
