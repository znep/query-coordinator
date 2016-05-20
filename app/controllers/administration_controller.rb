require 'csv'

class AdministrationController < ApplicationController
  include BrowseActions
  include CommonSocrataMethods
  include GeoregionsHelper
  include JobsHelper
  include ExternalFederationHelper

  # To learn why we include AdministrationHelper manually, see
  # the comment at the top of AdministrationHelper's implementation.
  # tl;dr "helper :all" in ApplicationController.
  # NOTE: AdministrationHelper is distinct from AdminHelper.
  include AdministrationHelper

  before_filter :check_member, :only => :index
  def index
    redirect_to '/manage/site_config' if CurrentDomain.module_enabled?(:govStat)
  end

  before_filter :only => [:datasets] {|c| c.check_auth_levels_any([UserRights::EDIT_OTHERS_DATASETS, UserRights::EDIT_SITE_THEME]) }
  def datasets
    unless AssetInventory.find.present?
      Airbrake.notify(:error_class => 'Asset Inventory missing for domain',
        :error_message => 'Asset Inventory feature flag is enabled but no dataset of display type assetinventory is found.',
        :session => {:domain => CurrentDomain.cname},
        :request => { :params => params })
       Rails.logger.error("Asset Inventory feature flag is enabled for #{CurrentDomain.cname} but no dataset of display type assetinventory is found.")
    end

    vtf = view_types_facet

    datasets_index = vtf[:options].index { |option|
      option[:value] == 'datasets'
    }

    unless datasets_index.present?
      datasets_index = 0
    end

    # always show "unpublished datasets" after "datasets", or at least after "data lens"
    vtf[:options].insert(datasets_index + 1, {
      :text => t('screens.admin.datasets.unpublished_datasets'), :value => 'unpublished',
      :class => 'typeUnpublished'})

    add_draft_display_type_if_enabled!(vtf[:options])

    facets = [
      vtf,
      categories_facet(params),
      topics_facet(params)
    ]
    @processed_browse = process_browse(request, {
      admin: true,
      browse_in_container: true,
      facets: facets,
      limit: 30,
      nofederate: true,
      view_type: 'table',
      a11y_table_description: t('screens.admin.datasets.table_description')
    }.merge(moderation_flag_if_needed))
  end

  #In the /admin/datasets endpoint ...
  # If View Moderation is ON, do exactly what's done today. Data Lenses will only be shown in /admin/datasets
  #   if they have been approved. Otherwise, they're shown in the view moderation queue (/admin/views)
  # If View Moderation is OFF, pass moderation: 'any' to the ViewSearch service so that we explicitly include
  #   all views regardless of their view moderation status.
  def moderation_flag_if_needed
    if CurrentDomain.feature?(:view_moderation)
      {}
    else
      {moderation: 'any'}
    end
  end

  before_filter :only => [:modify_sidebar_config] {|c| c.check_auth_level(UserRights::EDIT_SITE_THEME)}
  def modify_sidebar_config
    config = ::Configuration.get_or_create('sidebar', {'name' => 'Sidebar configuration'})

    params[:sidebar].each do |k, v|
      update_or_create_property(config, k.to_s, v)
    end

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
    respond_to do |format|
      format.html { redirect_to datasets_administration_path }
      format.data { render :json => config.to_json }
    end
  end

  before_filter :check_member, :only => :analytics
  def analytics
  end

  before_filter :only => [:canvas_pages] {|c| c.check_auth_level(UserRights::EDIT_PAGES)}
  def canvas_pages
    @pages = Page.find('$order' => 'name', 'status' => 'all')
  end

  before_filter :only => [:create_canvas_page, :post_canvas_page] {|c| c.check_auth_level(UserRights::CREATE_PAGES)}
  def create_canvas_page
    @cur_path = params[:path]
    @cur_title = params[:title]
  end

  def post_canvas_page
    title = params[:pageTitle]
    url = params[:pageUrl]
    if title.blank?
      flash[:error] = "Please enter a title"
      return redirect_to :action => 'create_canvas_page', :path => url, :title => title
    end
    if url.blank?
      prefix = CurrentDomain.module_enabled?(:govStat) ? '/reports/' : '/'
      # Let's generate one from the title
      url = prefix + title.convert_to_url
      i = 1
      check_url = url
      while Page.path_exists?(check_url) do
        check_url = url + '-' + i.to_s
        i += 1
      end
      url = check_url
    end
    url = '/' + url unless url.starts_with?('/')
    if Page.path_exists?(url)
      flash[:error] = "Path already exists; please choose a different one"
      return redirect_to :action => 'create_canvas_page', :path => url, :title => title
    end
    args = { :path => url, :name => title }
    args[:grouping] = 'report' if CurrentDomain.module_enabled?(:govStat)
    res = Page.create(args)
    redirect_to res.path + '?_edit_mode=true'
  end

  #
  # Manage Georegions
  #
  def allow_georegions_access?
    run_access_check do
      can_view_georegions_admin?(current_user)
    end
  end

  before_filter :allow_georegions_access?, :only => [
      :georegions, :add_georegion, :enable_georegion, :disable_georegion,
      :set_georegion_default_status, :edit_georegion, :remove_georegion
    ]
  def georegions
    jobs = incomplete_curated_region_jobs
    failed_jobs = failed_curated_region_jobs
    if jobs.nil? || failed_jobs.nil?
      flash[:notice] = t('screens.admin.georegions.flashes.service_unavailable_html')
    end

    @view_model = ::ViewModels::Administration::Georegions.new(
      CuratedRegion.all,
      incomplete_curated_region_jobs || [],
      failed_curated_region_jobs || [],
      CurrentDomain.strings.site_title
    )
  end

  def georegion
    curated_region = CuratedRegion.find(params[:id])
    respond_to do |format|
      format.data { render :json => {
          :success => true,
          :message => curated_region
        }.to_json }
    end

  end

  def add_georegion
    georegion_adder = ::Services::Administration::GeoregionAdder.new
    is_success = false
    error_message = t('error.error_500.were_sorry')
    success_message = nil

    # TODO: Remove feature flag check once we're using synthetic spatial lens shape ids exclusively
    enable_synthetic_spatial_lens_id = FeatureFlags.derive(nil, request)[:enable_synthetic_spatial_lens_id]

    begin
      success_message = georegion_adder.add(
        params[:id],
        params[:primaryKey],
        params[:geometryLabel],
        params[:name],
        { :enabledFlag => true },
        enable_synthetic_spatial_lens_id,
        forwardable_session_cookies
      )
      is_success = success_message.present?
    rescue CoreServer::CoreServerError => ex
      error_message = t(
        'screens.admin.georegions.flashes.add_georegion_error',
        :error_message => ex.error_message
      )
    rescue StandardError => ex
      error_message = "Error while adding georegion to domain: #{ex}"
    end
    handle_button_response(
      is_success,
      error_message,
      success_message,
      :georegions
    )
  end

  def enable_georegion
    curated_region = CuratedRegion.find(params[:id])
    is_success = false
    error_message = nil
    success_message = nil
    begin
      georegion_enabler.enable(curated_region)
      is_success = true
      success_message = t(
        'screens.admin.georegions.enable_success',
        :name => curated_region.name
      )
    rescue CoreServer::CoreServerError
      error_message = t('error.error_500.were_sorry')
    end
    handle_button_response(is_success, error_message, success_message, :georegions)
  end

  def disable_georegion
    curated_region = CuratedRegion.find(params[:id])
    is_success = false
    error_message = nil
    success_message = nil
    begin
      georegion_enabler.disable(curated_region)
      is_success = true
      success_message = t(
        'screens.admin.georegions.disable_success',
        :name => curated_region.name
      )
    rescue CoreServer::CoreServerError
      error_message = t('error.error_500.were_sorry')
    end
    handle_button_response(is_success, error_message, success_message, :georegions)
  end

  def set_georegion_default_status
    curated_region = CuratedRegion.find(params[:id])
    default_flag = params[:default_flag]
    is_success = false
    error_message = nil
    success_message = nil
    begin
      if default_flag == 'default'
        georegion_defaulter.default(curated_region)
        is_success = true
        success_message = t(
          'screens.admin.georegions.default_success',
          :name => curated_region.name
        )
      elsif default_flag == 'undefault'
        georegion_defaulter.undefault(curated_region)
        is_success = true
        success_message = t(
          'screens.admin.georegions.undefault_success',
          :name => curated_region.name
        )
      else
        error_message = t('error.error_500.were_sorry')
      end
    rescue CoreServer::CoreServerError
      error_message = t('error.error_500.were_sorry')
    rescue ::Services::Administration::DefaultGeoregionsLimitMetError
      error_message = t('screens.admin.georegions.default_georegions_limit', :limit => georegion_defaulter.maximum_default_count)
    end
    handle_button_response(is_success, error_message, success_message, :georegions)
  end

  def edit_georegion
    georegion_editor = ::Services::Administration::GeoregionEditor.new
    curated_region = CuratedRegion.find(params[:id])
    is_success = false
    error_message = nil
    success_message = nil
    redirect_action = :georegions

    begin
      updated_region = georegion_editor.edit(curated_region, params[:boundary])
      is_success = true
      if request.xhr?
        success_message = updated_region
      else
        success_message = t('screens.admin.georegions.configure_boundary.save_success')
      end
    rescue ::Services::Administration::MissingBoundaryNameError
      flash[:is_name_missing] = true
      error_message = t('screens.admin.georegions.configure_boundary.boundary_name_required_page_error')
      redirect_action = :configure_boundary
    rescue ::Services::Administration::MissingGeometryLabelError
      flash[:is_label_missing] = true
      error_message = t('screens.admin.georegions.configure_boundary.boundary_name_required_page_error')
      redirect_action = :configure_boundary
    rescue
      error_message = t('screens.admin.georegions.configure_boundary.save_error')
    end

    handle_button_response(is_success, error_message, success_message, redirect_action)
  end

  def georegion_candidate
    is_success = false
    error_message = nil
    success_message = nil

    begin
      success_message = ::ViewModels::Administration::GeoregionCandidate.new(params[:id])
      is_success = true
    rescue
      error_message = t('screens.admin.georegions.configure_boundary.save_error')
    end

    handle_button_response(is_success, error_message, success_message, :georegions)
  end

  def remove_georegion
    handle_button_response(true, 'error', 'success', :georegions)
  end

  def configure_boundary
    curated_region = CuratedRegion.find(params[:id])
    @view_model = ::ViewModels::Administration::ConfigureBoundary.new(
      curated_region,
      CurrentDomain.strings.site_title,
      !!flash[:is_name_missing]
    )
  end

  def poll_georegion_jobs
    begin
      message = {
        :georegions => CuratedRegion.all,
        :jobs => incomplete_curated_region_jobs,
        :failedJobs => failed_curated_region_jobs
      }
      success = true
    rescue StandardError => ex
      message = {
        :errorMessage => "Polling error: #{ex}"
      }
      success = false
    end
    render :json => {
      :message => message,
      :success => success
    }.to_json, :status => (success ? 200 : 500)
  end


  #
  # Manage Users and User Roles
  #

  before_filter :only => [:users, :set_user_role, :reset_user_password, :bulk_create_users,
                          :delete_future_user, :re_enable_user] {|c| c.check_auth_level(UserRights::MANAGE_USERS)}
  def users
    @roles_list = User.roles_list
    if !params[:username].blank?
      @search = params[:username]
      @user_search_results = Clytemnestra.search_users(:q => params[:username]).results
      @futures = FutureAccount.find.select { |f| f.email.downcase.include? params[:username].downcase }
    else
      @admins = find_privileged_users.sort{|x,y| (x.displayName || x.email).downcase <=>
        (y.displayName || y.email).downcase}
      @futures = FutureAccount.find
    end

    if @user_search_results.nil?
      @users_list = @admins
      @existing_user_actions = true
    elsif @user_search_results.empty?
      @table_title = t('screens.admin.users.no_users_found')
    else
      @table_title = t('screens.admin.users.search_results', :term => @search)
      @users_list = @user_search_results
      @existing_user_actions = false
    end

    respond_to do |format|
      format.html { render :action => 'users' }
      format.csv do
        render :text => CSV.generate { |csv|
          csv << User.csv_columns.values
          @users_list.each { |user| csv << user.to_csv_row }
        }
      end
    end
  end

  def set_user_role
    error_message = nil
    begin
      updated_user = User.set_role(params[:user_id], params[:role])
    rescue CoreServer::CoreServerError => ex
      error_message = ex.error_message
    end
    handle_button_response(updated_user, error_message, t('screens.admin.users.flashes.successful_update'), :users)
  end

  def reset_user_password
    if User.reset_password(params[:user_id])
      success = true
    else
      error_message = t('screens.admin.users.flashes.reset_email_failed')
    end
    handle_button_response(success, error_message, t('screens.admin.users.flashes.reset_email_sent'), :users)
  end

  def re_enable_user
    if User.re_enable_permissions(params[:user_id])
      success = true
    else
      error_message = t('screens.admin.users.flashes.reenable_failed')
    end
    handle_button_response(success, error_message, t('screens.admin.users.flashes.reenable_success'), :users)
  end

  def bulk_create_users
    role = params[:role]
    if !User.roles_list.include?(role.downcase)
      flash[:error] = t('screens.admin.users.flashes.invalid_role', :role => role)
      return (redirect_to :action => :users)
    end

    begin
      result = FutureAccount.create_multiple(params[:users], role)
      errors = result["errors"]
      created = result["created"]
    rescue CoreServer::CoreServerError => ex
      errors = [ex.error_message]
    end

    if !errors.blank?
      flash[:error] = errors.join(', ')
    elsif(created.blank?)
      flash[:error] = t('screens.admin.users.flashes.no_email_addresses')
      return (redirect_to :action => :users)
    else
      flash[:notice] = t('screens.admin.users.flashes.accounts_created', :count => created.size)
    end

    redirect_to :action => :users
  end

  def delete_future_user
    begin
      success = FutureAccount.delete(params[:id])
    rescue CoreServer::CoreServerError => ex
      error_message = ex.error_message
    end
    handle_button_response(success, error_message, t('screens.admin.users.flashes.pending_permissions_removed'), :users)
  end

  before_filter :only => [:comment_moderation] {|c| c.check_auth_level(UserRights::MODERATE_COMMENTS)}
  before_filter :only => [:comment_moderation] {|c| c.check_module('publisher_comment_moderation')}
  def comment_moderation
  end

  before_filter :only => [:views] {|c| c.check_auth_level(UserRights::APPROVE_NOMINATIONS)}
  before_filter :only => [:views] {|c| c.check_feature(:view_moderation)}
  def views
    view_facet = view_types_facet()
    view_facet[:options].select! { |item| @@moderatable_types.include? item[:value] }

    @processed_browse = process_browse(request, {
      datasetView: 'view',
      default_params: { moderation: 'pending' },
      browse_in_container: true,
      dataset_actions: 'Moderation Status',
      facets: [
        moderation_facet,
        view_facet,
        categories_facet(params),
        topics_facet(params)
      ],
      moderation: 'any',
      nofederate: 'true',
      suppress_dataset_creation: true,
      view_type: 'table',
      a11y_skip_to_content: true,
      a11y_table_description: t('screens.admin.view_moderation.table_description')
    })
  end


  before_filter :only => [:set_view_moderation_status] {|c| c.check_auth_level(UserRights::APPROVE_NOMINATIONS)}
  def set_view_moderation_status
    begin
      v = View.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash[:error] = "Could not find view to modify moderation status"
      return(redirect_to :action => 'views')
    end

    v.moderationStatus = (params[:approved] == 'yes')
    v.save!
    flash[:notice] = "The view '#{v.name}' has been #{v.moderation_status.downcase}. " +
        'Please allow a few minutes for the changes to be reflected on your home page'

    return(redirect_to (request.referer || {:action => 'views'}))
  end

  #
  # Social Data Player - theme customization
  #

  before_filter :only => [:sdp_templates, :sdp_template_create, :sdp_template, :sdp_set_default_template, :sdp_delete_template] {|c| c.check_auth_level(UserRights::EDIT_SDP)}
  def sdp_templates
    @templates = WidgetCustomization.find.reject{ |t| t.hidden }
    @default_template_id = CurrentDomain.default_widget_customization_id
  end

  def sdp_template_create
    unless params[:new_template_name].present?
      flash.now[:error] = 'Template name is required'
      return (render 'shared/error', :status => :bad_request)
    end

    begin
      widget_customization = WidgetCustomization.create({ :name => params[:new_template_name],
                                                          :customization => WidgetCustomization.default_theme(1).to_json })
    rescue CoreServer::CoreServerError => e
      if e.error_message == 'This domain has reached its template limit'
        flash.now[:error] = "You have created your allotted number of templates. Please delete one or contact support to purchase more."
        return render 'shared/error', :status => :bad_request
      else
        flash.now[:error] = "An error occurred during your request: #{e.error_message}"
        return render 'shared/error'
      end
    end

    redirect_options = {:action => :sdp_template, :id => widget_customization.uid}
    redirect_options[:view_id] = params[:view_id] if params[:view_id].present?
    redirect_to redirect_options
  end

  def sdp_template
    if params[:view_id].present?
      begin
        @view = View.find(params[:view_id])
      rescue CoreServer::ResourceNotFound
          flash.now[:error] = 'A dataset with which to preview could not be found.'
          return (render 'shared/error', :status => :not_found)
        return
      end
    else
      views = Clytemnestra.search_views(
        { :limit => 1, :nofederate => true, :limitTo => 'tables', :datasetView => 'dataset' }).results
      @view = views.first unless views.nil?
    end

    if @view.nil?
      flash.now[:error] = 'Please create a dataset you can publish first'
      return (render 'shared/error', :status => :invalid_request)
    end

    begin
      @widget_customization = WidgetCustomization.find(params[:id])
      @customization = WidgetCustomization.merge_theme_with_default(@widget_customization.customization)
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This template customization cannot be found'
      return (render 'shared/error', :status => :not_found)
    end
  end

  def sdp_set_default_template
    configuration = ::Configuration.find_by_type('site_theme',  true, request.host, false)[0]
    begin
      customization = WidgetCustomization.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'Can not set template as default: template not found'
      return (render 'shared/error', :status => :not_found)
    end

    update_or_create_property(configuration, "sdp_template", params[:id])

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
    respond_to do |format|
      format.html { redirect_to :action => :sdp_templates }
      format.data { render :json => { :success => true } }
    end
  end

  def sdp_delete_template
    begin
      customization = WidgetCustomization.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'Can not set template as default: template not found'
      return (render 'shared/error', :status => :not_found)
    end

    if customization.uid == CurrentDomain.default_widget_customization_id
      flash.now[:error] = 'Can not delete the default template. Please choose a new default first.'
      return (render 'shared/error', :status => :invalid_request)
    end

    # Don't actually delete it, just don't show it in the UI
    customization.hidden = true
    customization.save!

    respond_to do |format|
      format.html { redirect_to :action => :sdp_templates }
      format.data { render :json => { :success => true } }
    end
  end


  #
  # Open Data Federation
  #

  before_filter :only => [:federations, :delete_federation, :accept_federation, :reject_federation, :create_federation] {|c| c.check_auth_level(UserRights::FEDERATIONS)}
  before_filter :only => [:federations, :delete_federation, :accept_federation, :reject_federation, :create_federation] {|c| c.check_module_available('federations')}

  before_filter :only => [:external_federation, :delete_external_federation, :create_external_federation, :edit_external_federation, :update_external_federation] {|c| c.check_auth_level(UserRights::FEDERATIONS)}
  before_filter :only => [:external_federation, :delete_external_federation, :create_external_federation, :edit_external_federation, :update_external_federation] {|c| c.check_module_available('federations')}
  before_filter :only => [:external_federation, :delete_external_federation, :create_external_federation, :edit_external_federation, :update_external_federation] {|c| c.check_feature_flag('external_federation')}
  before_filter :only => [:edit_external_federation, :update_external_federation] {|c| c.check_feature_flag('edit_external_federation')}

  def federations
    if params[:dataset].nil?
      @federations = Federation.find
    else
      @search_dataset = params[:dataset]
      @federations = Federation.find(:dataset => params[:dataset])
    end

    if !params[:domain].nil?
      @search_domain = params[:domain]
      @domains = Domain.find(:method => 'findAvailableFederationTargets', :domain => params[:domain])
    end

    if FeatureFlags.derive(nil, request).external_federation
      begin
        @external_federations = ExternalFederation.servers
      rescue EsriCrawler::ServerError => error
        display_external_error(error, :federations)
      rescue StandardError => ex
        Rails.logger.warn("Encountered error while trying to access Esri Crawler Service: #{ex}")
        flash[:notice] = t('screens.admin.external_federation.service_unavailable')
        @failed_esri_connection = true
      end
    end
  end

  def external_federation
    @server = {}
  end

  def display_external_error(error, redirection)
    begin
      reason = error.body['error']['reason']
      params = error.body['error']['params'].symbolize_keys
      flash[:error] = t("screens.admin.external_federation.errors.#{reason}") % params
    rescue
      flash[:error] = t("screens.admin.external_federation.errors.problem_with_errors")
    end
    redirect_to :action => redirection
  end

  def create_external_federation
    @server = params[:server] || {}
    begin
      response = ExternalFederation.create(params[:server][:esri_domain])
    rescue EsriCrawler::ServerError => error
      return display_external_error(error, :external_federation)
    rescue StandardError => error
      flash[:notice] = t('screens.admin.external_federation.service_unavailable')
      return redirect_to :action => :federations
    end

    respond_to do |format|
      format.html do
        flash[:notice] = t('screens.admin.external_federation.flashes.created')
        redirect_to :action => :federations
      end
      format.data { render :json => { :success => true } }
    end
  end

  def edit_external_federation
    @sync_types = Hash[['ignore', 'catalog', 'data'].map do |k|
      [t("screens.admin.external_federation.#{k}"), k]
    end]
    begin
      @tree = ExternalFederation.tree(params[:server_id])
      @server = ExternalFederation.server(params[:server_id])
    rescue EsriCrawler::ResourceNotFound => error
      flash[:error] = t('screens.admin.federation.flashes.invalid_domain')
      redirect_to :action => :federations
    rescue EsriCrawler::ServerError => error
      display_external_error(error, :federations)
    rescue StandardError => error
      flash[:notice] = t('screens.admin.external_federation.service_unavailable')
      redirect_to :action => :federations
    end
  end

  def update_external_federation
    begin
      @response = ExternalFederation.update_server(params[:server_id], params['server'])
      @server = ExternalFederation.server(params[:server_id])
      @tree = ExternalFederation.tree(params[:server_id])
    rescue EsriCrawler::ServerError => error
      return display_external_error(error, :edit_external_federation)
    end
    respond_to do |format|
      format.html do
        flash[:notice] = t('screens.admin.external_federation.flashes.updated')
        redirect_to :action => :edit_external_federation
      end
      format.data { render :json => { :success => true } }
    end
  end

  def delete_external_federation
    begin
      @response = ExternalFederation.delete_server(params[:server_id])
      respond_to do |format|
        format.html { redirect_federation(t('screens.admin.external_federation.flashes.deleted')) }
        format.data { render :json => { :success => true } }
      end
    rescue EsriCrawler::ServerError => error
      return display_external_error(error, :federations)
    end
  end

  def delete_federation
    Federation.delete(params[:id])
    respond_to do |format|
      format.html { redirect_federation(t('screens.admin.federation.flashes.deleted')) }
      format.data { render :json => { :success => true } }
    end
  end

  def accept_federation
    Federation.accept(params[:id])
    respond_to do |format|
      format.html { redirect_federation(t('screens.admin.federation.flashes.accepted')) }
      format.data { render :json => { :success => true, :message => t('screens.admin.federation.accepted') } }
    end
  end

  def reject_federation
    Federation.reject(params[:id])
    respond_to do |format|
      format.html { redirect_federation(t('screens.admin.federation.flashes.rejected')) }
      format.data { render :json => { :success => true, :message => t('screens.admin.federation.pending')} }
    end
  end

  def create_federation
    begin
      data = Federation.new
      target_domain = Domain.find(params[:new_federation][:target_domain])
      data.targetDomainId = target_domain.id
      data.searchBoost = params[:new_federation][:search_boost]
      Federation.create(data)
    rescue CoreServer::ResourceNotFound => e
      flash[:error] = t('screens.admin.federation.flashes.invalid_domain')
      return(redirect_to :action => :federations)
    rescue CoreServer::CoreServerError => e
      flash[:error] = e.error_message
      return(redirect_to :action => :federations)
    end

    respond_to do |format|
      flash[:notice] = t('screens.admin.federation.flashes.created')
      return(redirect_to :action => :federations)
    end
  end

  #
  # Dataset-level metadata (custom fields, categories)
  #
  before_filter :only => [:metadata, :create_metadata_fieldset, :delete_metadata_fieldset, :create_metadata_field, :save_metadata_field, :delete_metadata_field, :toggle_metadata_option, :move_metadata_field, :create_category, :delete_category] {|c| c.check_auth_level(UserRights::EDIT_SITE_THEME)}
  def metadata
    config = ::Configuration.get_or_create('metadata', {'name' => 'Metadata configuration'})
    @metadata = config.properties.fieldsets || []
    @categories = get_configuration('view_categories', true).properties.sort { |a, b| a[0].downcase <=> b[0].downcase }
    @locales = CurrentDomain.available_locales
  end

  def create_metadata_fieldset
    config = get_configuration('metadata')
    metadata = config.properties.fieldsets || []
    field = params[:newFieldsetName]

    if field.nil? || field.strip().blank?
      flash[:error] = t('screens.admin.metadata.flashes.fieldset_name_required')
      return redirect_to :action => 'metadata'
    end

    if metadata.any? { |f| f['name'].downcase == field.downcase }
      flash[:error] = t('screens.admin.metadata.flashes.fieldset_duplicated', :name => field)
      return redirect_to :action => 'metadata'
    end

    metadata << Hashie::Mash.new({ 'name' => field, 'fields' => [] })

    save_metadata(config, metadata, t('screens.admin.metadata.flashes.successful_create'))
  end

  def delete_metadata_fieldset
    config = get_configuration('metadata')
    metadata = config.properties.fieldsets
    metadata.delete_at(params[:fieldset].to_i)

    save_metadata(config, metadata, t('screens.admin.metadata.flashes.successful_remove'))
  end

  def create_metadata_field
    config = get_configuration('metadata')

    field_name = params[:newFieldName]
    if (field_name.nil? || field_name.strip().empty?)
      flash[:error] = t('screens.admin.metadata.flashes.field_name_required')
      return redirect_to :action => 'metadata'
    end

    metadata = config.properties.fieldsets || []
    fieldset = metadata[params[:fieldset].to_i] || {}

    fieldset['fields'] ||= []

    # No dups
    if fieldset['fields'].any? { |f| f['name'].downcase == field_name.downcase }
      flash[:error] = t('screens.admin.metadata.flashes.field_duplicated', :name => field_name)
      return redirect_to :action => 'metadata'
    end

    fieldset['fields'] << Hashie::Mash.new({ 'name' => field_name,
      'required' => false })

    save_metadata(config, metadata, t('screens.admin.metadata.flashes.field_successful_create'))
  end

  def save_metadata_field
    config   = get_configuration('metadata')
    metadata = config.properties.fieldsets
    fieldset = metadata[params[:fieldset].to_i]

    if fieldset.blank?
      return (render json: {error: true, message: t('screens.admin.metadata.flashes.no_such_fieldset')})
    end

    field = fieldset.fields.detect{ |f| f['name'].downcase == params[:field].to_s.downcase }
    if field.nil?
      return (render json: {error: true, message: t('screens.admin.metadata.flashes.no_such_field') })
    end

    options = params[:options]
    if options.blank?
      field['type'] = 'text'
    else
      field['type'], field['options'] = 'fixed', options
    end

    save_metadata(config, metadata, t('screens.admin.metadata.flashes.field_successful_save'), true)
  end

  def delete_metadata_field
    config = get_configuration('metadata')
    metadata = config.properties.fieldsets
    metadata[params[:fieldset].to_i].fields.delete_at(params[:index].to_i)

    save_metadata(config, metadata, t('screens.admin.metadata.flashes.field_successful_remove'))
  end

  def toggle_metadata_option
    config = get_configuration('metadata')
    metadata = config.properties.fieldsets
    fieldset = metadata[params[:fieldset].to_i].fields
    option   = params[:option]

    field = fieldset[params[:index].to_i]
    field[option] = field[option].blank? ? true : false

    update_or_create_property(config, 'fieldsets', metadata)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    respond_to do |format|
      format.html { redirect_to :action => 'metadata' }
      format.data { render :json => {:success => true, :option => option, :value => field[option]} }
    end
  end

  def move_metadata_field
    config = get_configuration('metadata')
    metadata = config.properties.fieldsets
    fieldset = metadata[params[:fieldset].to_i].fields

    field = fieldset.detect { |f| f['name'] == params[:field] }

    if field.nil?
      flash[:error] = t('screens.admin.metadata.flashes.cannot_move_field', :name => params[:field])
      respond_to do |format|
        format.html { return redirect_to :action => 'metadata' }
        format.data { return render :json => {:error => true, :error_message => flash[:error]} }
      end
    end

    index = fieldset.index(field)
    swap_index = params[:direction] == 'up' ? index-1 : index+1

    fieldset[index], fieldset[swap_index] = fieldset[swap_index], fieldset[index]

    update_or_create_property(config, 'fieldsets', metadata)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    respond_to do |format|
      format.html { redirect_to :action => 'metadata' }
      format.data { render :json => {:success => true, :direction => params[:direction]} }
    end
  end

  def create_category
    new_category = params[:new_category]
    new_category_parent = params[:new_category_parent]
    new_category_displayed = params[:new_category_displayed] == "1"

    if new_category.blank?
      flash[:error] = "Please enter a name to create a new category"
      return redirect_to metadata_administration_path
    end

    config = get_configuration('view_categories')
    # Copy over default config
    if config.nil?
      config = create_config_copy('View categories', 'view_categories')
    end

    if config.raw_properties.any? {|k,v| k.downcase == new_category.downcase }
      flash[:error] = "Cannot create duplicate category named '#{new_category}'"
      return redirect_to metadata_administration_path
    end

    # Create a property with
    # name: category, value: { parent: parent_category, enabled: true }
    # where parent is optional
    prop_val = { :enabled => new_category_displayed }
    if !new_category_parent.blank?
      prop_val[:parent] = new_category_parent.titleize_if_necessary
    end

    locales = params[:new_locales] || []
    prop_val[:locale_strings] = locales if !locales.empty?

    config.create_property(new_category.titleize_if_necessary, prop_val)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    flash[:notice] = "Category successfully created"
    redirect_to metadata_administration_path
  end

  def update_category
    category = params[:category]
    config = get_configuration('view_categories')
    if config.nil?
      config = create_config_copy('View categories', 'view_categories')
    end

    cat_config = config.raw_properties[category[:name]]
    if cat_config.nil?
      flash[:error] = "Could not update category named '#{category[:name]}'"
      return redirect_to metadata_administration_path
    end

    cat_config[:locale_strings] = category[:locale]

    config.update_property(category[:name], cat_config)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    flash[:notice] = "Category successfully updated"
    redirect_to metadata_administration_path
  end

  def delete_category
    category = params[:category]

    if category.blank?
      flash[:error] = "Please select a category to delete from the list"
      return redirect_to metadata_administration_path
    end

    config = get_configuration('view_categories')
    if config.nil?
      config = create_config_copy('View categories', 'view_categories')
    end

    if !config.raw_properties.any? { |k,v| k == category }
      flash[:error] = "Could not remove category named '#{category}'"
      return redirect_to metadata_administration_path
    end

    CoreServer::Base.connection.batch_request do |batch_id|
      config.raw_properties.each do |prop, value|
        if value['parent'].present? && value['parent'].downcase == category.downcase
          config.update_property(prop, value.merge('parent' => nil), batch_id)
        end
      end
      config.delete_property(category, false, batch_id)
    end

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    flash[:notice] = "Category successfully removed"
    redirect_to metadata_administration_path
  end

  before_filter :only => [:jobs, :show_job] do |c|
    c.check_feature_flag(:show_admin_processes) && c.check_auth_level(UserRights::VIEW_ALL_DATASET_STATUS_LOGS)
  end

  #
  # Jobs log
  #
  def jobs
    page_size = 30
    all_threshold = 8
    page_idx = params.fetch(:page, '1').to_i
    offset = (page_idx - 1) * page_size

    activity_type = params[:activity_type]
    activity_type = activity_type == 'All' ? nil : activity_type

    # parse start/end date from params
    date_string = params[:date_range]
    start_date = nil
    end_date = nil
    if date_string.present?
      begin
        dates = date_string.split(' - ')
        start_date = DateTime.strptime(dates[0] << ' 00:00:00', '%m/%d/%Y %H:%M:%S') # beginning of start day...
        if dates.count >= 2
          end_date = DateTime.strptime(dates[1] << ' 23:59:59', '%m/%d/%Y %H:%M:%S') # to end of end day
        end
      rescue ArgumentError
        Rails.logger.warn("Invalid date in AdministrationController#jobs: #{date_string}")
      end
    end

    activities_response = ImportActivity.find_all_by_created_at_descending({
      :offset => offset,
      :limit => page_size,
      :activityType => activity_type,
      :startDate => start_date,
      :endDate => end_date
    })
    @activities = activities_response[:activities]
    count = activities_response[:count]

    # preserve URL parameters across pages
    pager_params = {}
    if activity_type.present?
      pager_params[:activity_type] = activity_type
    end

    if date_string.present?
      pager_params[:date_range] = date_string
    end

    @pager_elements = Pager::paginate(count, page_size, page_idx, { :all_threshold => all_threshold, :params => pager_params })
  end

  def show_job
    begin
      @activity = ImportActivity.find(params[:id])
    rescue ImportStatusService::ResourceNotFound
      return render_404
    rescue ImportStatusService::ServerError
      return render_500
    end
  end

  #
  # Homepage Customization
  #

  before_filter :only => [:home, :save_featured_views] {|c| c.check_auth_levels_any([UserRights::MANAGE_STORIES, UserRights::FEATURE_ITEMS, UserRights::EDIT_SITE_THEME])}
  def home
    @stories = Story.find.sort
    @features = get_configuration().properties.featured_views
    @catalog_config = CurrentDomain.configuration('catalog')
  end

  def save_featured_views
    config = get_configuration

    # Rails apparently converts [] to nil; so fix it
    new_features = params[:features] || []
    update_or_create_property(config, 'featured_views', new_features)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
    clear_homepage_cache

    respond_to do |format|
      format.html { redirect_to home_administration_path }
      format.data { render :json => new_features }
    end
  end

  before_filter :only => [:delete_story, :new_story, :create_story, :move_story, :edit_story, :stories_appearance, :update_stories_appearance] {|c| c.check_auth_level(UserRights::MANAGE_STORIES)}
  def delete_story
    begin
      Story.delete(params[:id])
      clear_homepage_cache
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = t('screens.admin.home.flashes.delete_error')
      return render 'shared/error', :status => :not_found
    end

    respond_to do |format|
      format.html { redirect_to home_administration_path }
      format.data { render :json => {:success => true} }
    end
  end

  def new_story
  end

  def create_story
    story = Hashie::Mash.new
    parse_story_params(story, params[:story])
    story.customization = story.customization.to_json unless story.customization.nil?
    story.merge!(params[:story].stringify_keys)

    begin
      Story.create(story)
      clear_homepage_cache
    rescue CoreServer::CoreServerError => e
      flash.now[:error] = t('screens.admin.home.flashes.create_error', :error_message => e.error_message)
      return render 'shared/error', :status => :bad_request
    end

    redirect_to :home_administration
  end

  def move_story
    begin
      story_lo = Story.find(params[:id])
      story_hi = Story.find(params[:other])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = t('screens.admin.home.flashes.move_error')
      return render 'shared/error', :status => :not_found
    end

    story_lo.order, story_hi.order = story_hi.order, story_lo.order
    story_lo.save!
    story_hi.save!
    flash.now[:notice] = t('screens.admin.home.flashes.move_success')
    clear_homepage_cache
    redirect_to :home_administration
  end

  def edit_story
    begin
      @story = Story.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = t('screens.admin.home.flashes.edit_error')
      return render 'shared/error', :status => :not_found
    end

    if params[:story].present?
      parse_story_params(@story, params[:story])
      @story.update_attributes(params[:story].stringify_keys)
      @story.save!
      flash.now[:notice] = t('screens.admin.home.flashes.edit_success')
      clear_homepage_cache
    end
  end

  def stories_appearance
    @stories = Story.find

    config_properties = get_configuration.properties
    if config_properties.theme_v2b.nil? || config_properties.theme_v2b.stories.nil?
      @story_theme = CurrentDomain.theme.stories
    else
      @story_theme = config_properties.theme_v2b.stories
    end
  end

  def update_stories_appearance
    config = get_configuration

    theme = config.properties.theme_v2b || {}

    update_or_create_property(config, 'theme_v2b', theme.merge({ 'stories' => params[:stories] }))

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    respond_to do |format|
      format.html { redirect_to home_administration_path }
      format.data { render :json => params[:stories] } # could be problematic?
    end
  end

  before_filter :only => [:modify_catalog_config] {|c| c.check_auth_level(UserRights::EDIT_SITE_THEME)}
  def modify_catalog_config
    config = get_configuration('catalog')
    if config.nil?
      opts = { 'name' => 'Catalog Configuration', 'default' => true,
        'type' => 'catalog', 'domainCName' => CurrentDomain.cname }
      config = ::Configuration.create(opts)
    end

    params[:catalog].each do |k, v|
      update_or_create_property(config, k.to_s, v)
    end

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
    respond_to do |format|
      format.html { redirect_to home_administration_path }
      format.data { render :json => config.to_json }
    end
  end

  before_filter :only => [:tos] {|c| c.check_auth_level(UserRights::MANAGE_USERS)}
  def tos
    @tos = CurrentDomain.strings.terms_of_service
    return render_404 if @tos.blank?

    if request.post?
      if params[:terms_accepted].present?
        actions = ::Configuration.get_or_create('actions', {:name => 'Actions'})
        update_or_create_property(actions, 'tos_accepted', {
          :user => current_user,
          :text => @tos,
          :timestamp => Time.now
        })
        flash[:notice] = "Thank you for accepting the terms of service"
        return(redirect_to :action => :index)
      else
        flash.now[:error] = "You must agree to the provided terms to continue."
      end
    end
  end

  # General accessors for admins

  skip_before_filter :require_user, :only => [:configuration]
  def configuration
    # Proxy configurations, with access checks
    return false unless params[:type] == 'metadata' &&
      check_auth_levels_any([UserRights::EDIT_SITE_THEME, UserRights::EDIT_PAGES]) ||
      params[:type] == 'catalog' || params[:type] == 'view_categories'

    config = get_configuration(params[:type], params[:merge])
    respond_to do |format|
      format.data { render :json => config.to_json }
    end
  end

  skip_before_filter :require_user, :only => [:flag_out_of_date]
  def flag_out_of_date
    if authenticate_with_http_basic do |u, p|
        user_session = UserSession.new('login' => u, 'password' => p)
        user_session.save && check_auth_levels_any([UserRights::EDIT_SITE_THEME, UserRights::EDIT_PAGES, UserRights::CREATE_PAGES])
    end
      CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
      respond_to do |format|
        format.html { render :text => 'Done' }
        format.data { render :json => '"Done"' }
      end
    else
      request_http_basic_authentication
    end
  end

  def asset_inventory
    asset_inventory = AssetInventory.find

    if asset_inventory.present?
      redirect_to :controller => 'datasets', :action => 'show', :id => asset_inventory.id
    else
      render 'shared/error', :status => :not_found
    end
  end

  #
  # Access checks
  #
  # Most content on the admin site has access controlled by:
  # * Whether you have a specific access level
  # * Whether you are a member of the domain at all
  # * Whether a module is enabled for the domain
  # * Whether a feature is enabled for the domain
  #
  # Checks that require used of the current_user need to be instance methods and
  # and public functions in order to be used in a before_filter; The other
  # checks are easier to define as class methods and can remain private.
  #
public

  def check_auth_level(level)
    return run_access_check{CurrentDomain.user_can?(current_user, level)}
  end
  def check_auth_levels_any(levels)
    return run_access_check{levels.any?{|l| CurrentDomain.user_can?(current_user, l)}}
  end
  def check_auth_levels_all(levels)
    return run_access_check{levels.all?{|l| CurrentDomain.user_can?(current_user, l)}}
  end
  def check_member
    return run_access_check{CurrentDomain.member?(current_user)}
  end
  def check_module(mod)
    return run_access_check{CurrentDomain.module_enabled?(mod)}
  end
  def check_module_available(mod)
    return run_access_check{CurrentDomain.module_available?(mod)}
  end
  def check_feature(feature)
    return run_access_check{CurrentDomain.feature?(feature)}
  end
  def check_approval_rights
    return run_access_check{current_user.can_approve?}
  end
  def check_feature_flag(feature_flag)
    run_access_check { feature_flag?(feature_flag, request) }
  end

private

  def run_access_check(&block)
    if yield
      return true
    else
      render_forbidden
      return false
    end
  end

  def parse_story_params(story, story_params)
    if story_params[:image].present?
      story.imageId = Asset.create(story_params[:image]).id
      story_params.delete(:image)
    end

    customization = story.customization || {}
    [:backgroundColor, :link].each do |key|
      unless story_params[key].nil?
        customization[key.to_s] = story_params[key]
        story_params.delete(key)
      end
    end

    story.customization = customization
  end

  def find_privileged_users
    User.find :method => 'findPrivilegedUsers'
  end

  def redirect_federation(message = nil)
    flash[:notice] = message unless message.nil?
    redirect_to :action => :federations
  end

  def create_config_copy(name, type, parentId = nil)
    original_config = get_configuration(type, true).raw_properties

    opts = { 'name' => name, 'default' => true, 'type' => type,
      'domainCName' => CurrentDomain.cname }

    unless parentId.nil?
      opts['parentId'] = parentId
    end

    config = ::Configuration.create(opts)

    # Copy over the original, merged values
    CoreServer::Base.connection.batch_request do |batch_id|
      original_config.each {|k,v| config.create_property(k, v, batch_id) }
    end
    return config
  end

  def update_or_create_property(configuration, name, value)
    configuration.update_or_create_property(name, value)
  end

  def clear_homepage_cache
    # clear the homepage cache since assumedly something about them updated
    cache_key = app_helper.cache_key('canvas-homepage', { 'domain' => CurrentDomain.cname })
    clear_success = expire_fragment(cache_key)
  end

  def get_configuration(type='site_theme', merge=false)
    ::Configuration.find_by_type(type, true, CurrentDomain.cname, merge).first
  end

  def georegion_enabler
    @georegion_enabler ||= ::Services::Administration::GeoregionEnabler.new
  end

  def georegion_defaulter
    @georegion_defaulter ||= ::Services::Administration::GeoregionDefaulter.new
  end

  def save_metadata(config, metadata, successMessage, json = false)
    update_or_create_property(config, 'fieldsets', metadata)

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    if json
      render json: {message: successMessage, success: true}
    else
      flash[:notice] = successMessage
      redirect_to :action => 'metadata'
    end
  end

  def handle_button_response(success, error_message, success_message, redirect_action)
    respond_to do |format|
      format.html do
        if error_message
          flash[:error] = error_message.html_safe
        else
          flash[:notice] = success_message.html_safe
        end
        redirect_to({ :action => redirect_action }.merge(request.query_parameters))
      end
      format.any(:js, :json, :data) do
        if success
          render :json => {:success => true, :message => success_message}.to_json
        else
          render :json => {:error => true, :message => error_message}.to_json
        end
      end
    end
  end

  # Need an instance for using cache_key() and pluralize()
  def app_helper
    AppHelper.instance
  end

  @@default_embed_options = {
    :suppressed_facets => {
      :type => false,
      :category => false,
      :topic => false
    },
    :disable => { },
    :defaults => { },
    :limit => 10
  }

end

class AppHelper
  include Singleton
  include ApplicationHelper
  include ActionView::Helpers::TextHelper
end
