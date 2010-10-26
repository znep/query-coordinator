class AdministrationController < ApplicationController
  include BrowseActions

  def index
    check_member()
  end

  def datasets
    check_auth_level('edit_others_datasets')

    @browse_in_container = true
    @opts = {:admin => true}
    process_browse!
  end

  def analytics
    check_member()
    check_module('advanced_metrics')
  end

  def users
    check_auth_level('manage_users')

    @roles_list = User.roles_list
    if !params[:username].blank?
      @search = params[:username]
      @user_search_results= User.find :name => params[:username]
    else
      @admins = find_privileged_users.sort{|x,y| x.displayName <=> y.displayName}
    end

    if @user_search_results.nil?
      @users_list = @admins
      @existing_user_actions = true
    elsif @user_search_results.empty?
      @table_title = 'No users found.'
    else
      @table_title = "Search Results for '#{@search}'"
      @users_list = @user_search_results
      @existing_user_actions = false
    end
  end
  def set_user_role
    check_auth_level('manage_users')

    error_message = nil
    begin
      updated_user = User.set_role(params[:user_id], params[:role])
    rescue CoreServer::CoreServerError => ex
      error_message = ex.error_message
    end
    Rails.logger.info("Updated: #{updated_user.inspect}")
    respond_to do |format|
      format.data do
        if updated_user
          render :json => {:success => true}
        else
          render :json => {:error => true, :message => error_message}
        end
      end
      format.html do
        if error_message
          flash[:error] = error_message
        else
          flash[:notice] = "User successfully updated"
        end
        redirect_to :action => :users
      end
    end
  end

  def moderation
    check_auth_level('moderate_comments')
    check_module('publisher_comment_moderation')
  end

  def sdp_templates
    check_auth_level('edit_sdp')
    check_module('sdp_customizer')

    @templates = WidgetCustomization.find.reject{ |t| t.hidden }
    @default_template_id = CurrentDomain.default_widget_customization_id
  end
  def sdp_template_create
    check_auth_level('edit_sdp')
    check_module('sdp_customizer')

    unless params[:new_template_name].present?
      flash.now[:error] = 'Template name is required'
      return (render 'shared/error', :status => :bad_request)
    end

    widget_customization = WidgetCustomization.create({ :name => params[:new_template_name],
                                                        :customization => WidgetCustomization.default_theme(1).to_json })

    redirect_options = {:action => :sdp_template, :id => widget_customization.uid}
    redirect_options[:view_id] = params[:view_id] if params[:view_id].present?
    redirect_to redirect_options
  end
  def sdp_template
    check_auth_level('edit_sdp')
    check_module('sdp_customizer')

    if params[:view_id].present?
      begin
        @view = View.find(params[:view_id])
      rescue CoreServer::ResourceNotFound
          flash.now[:error] = 'This ' + I18n.t(:blist_name).downcase +
            ' cannot be found, or has been deleted.'
          return (render 'shared/error', :status => :not_found)
        return
      end
    else
      views = View.find(:public_only => true, :limit => 10) # hopefully 10 will be enough?
      @view = views.find{ |view| !view.is_alt_view? } || view.first unless views.nil?
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
    check_auth_level('edit_sdp')
    check_module('sdp_customizer')

    configuration = Configuration.find_by_type('site_theme',  true, request.host, false)[0]
    begin
      customization = WidgetCustomization.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'Can not set template as default: template not found'
      return (render 'shared/error', :status => :not_found)
    end

    update_or_create_property(configuration, "sdp_template", params[:id]) do 
      configuration.raw_properties["sdp_template"].nil?
    end

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
    respond_to do |format|
      format.data { render :json => { :success => true } }
      format.html { redirect_to :action => :sdp_templates }
    end
  end
  def sdp_delete_template
    check_auth_level('edit_sdp')
    check_module('sdp_customizer')

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
      format.data { render :json => { :success => true } }
      format.html { redirect_to :action => :sdp_templates }
    end
  end

  ## open data federation
  def federations
    check_auth_level('federations')
    check_module('federations')

    if (params[:dataset].nil?)
      @federations = DataFederation.find
    else
      @search_dataset = params[:dataset]
      @federations = DataFederation.find(:dataset => params[:dataset])
    end

    if (!params[:domain].nil?)
      @search_domain = params[:domain]
      @domains = Domain.find(:method => 'findAvailableFederationTargets', :domain => params[:domain])
    end
  end
  def delete_federation
    check_auth_level('federations')
    check_module('federations')

    DataFederation.delete(params[:id])
    respond_to do |format|
      format.data { render :json => { :success => true } }
      format.html { redirect_federation("Federation successfully deleted") }
    end
  end
  def accept_federation
    check_auth_level('federations')
    check_module('federations')

    DataFederation.accept(params[:id])
    respond_to do |format|
      format.data { render :json => { :success => true, :message => 'Accepted' } }
      format.html { redirect_federation("Federation successfully accepted") }
    end
  end
  def reject_federation
    check_auth_level('federations')
    check_module('federations')

    DataFederation.reject(params[:id])
    respond_to do |format|
      format.data { render :json => { :success => true, :message => 'Pending' } }
      format.html { redirect_federation("Federation successfully rejected") }
    end
  end
  def create_federation
    check_auth_level('federations')
    check_module('federations')

    begin
      data = DataFederation.new
      target_domain = Domain.find(params[:new_federation][:target_domain])
      data.targetDomainId = target_domain.id
      DataFederation.create(data)
    rescue CoreServer::ResourceNotFound => e
      return respond_to do |format|
        format.data { render :json => {'error' => 'Target domain is invalid'}.to_json }
        format.html do
          flash[:error] = "Could not create data federation: target domain is invalid"
          redirect_to :action => :federations
        end
      end
    rescue CoreServer::CoreServerError => e
      return respond_to do |format|
        format.data { render :json => {'error' => e.error_message}.to_json }
        format.html do
          flash[:error] = e.error_message
          redirect_to :action => :federations
        end
      end
    end

    respond_to do |format|
      format.data { render :json => data.to_json() }
      format.html do
        flash[:notice] = "Federation successfully created"
        redirect_to :action => :federations
      end
    end
  end

  def verify_layer_url
    response = fetch_layer_info(params[:url])
    respond_to do |format| format.data { render :json => response.to_json } end
  end

  # Dataset-level metadata (custom fields, categories)
  def metadata
    check_auth_level('edit_site_theme')
  end
  def create_metadata_fieldset
    check_auth_level('edit_site_theme')
    config = get_configuration()
    metadata = config.properties.custom_dataset_metadata || []
    field = params[:newFieldsetName]

    if field.nil? || field.strip().blank?
      flash[:error] = "Cannot create fieldset without a name"
      return redirect_to :action => 'metadata'
    end

    if metadata.any? { |f| f['name'].downcase == field.downcase }
      flash[:error] = "Cannot create duplicate fieldset named '#{field}'"
      return redirect_to :action => 'metadata'
    end

    metadata << Hashie::Mash.new({ 'name' => field, 'fields' => [] })

    save_metadata(config, metadata, "Fieldset Successfully Created")
  end
  def delete_metadata_fieldset
    check_auth_level('edit_site_theme')
    config = get_configuration()
    metadata = config.properties.custom_dataset_metadata
    metadata.delete_at(params[:fieldset].to_i)

    save_metadata(config, metadata, "Fieldset Successfully Removed")
  end
  def create_metadata_field
    check_auth_level('edit_site_theme')

    config = get_configuration()

    field_name = params[:newFieldName]
    if (field_name.nil? || field_name.strip().empty?)
      flash[:error] = "Cannot create a field with no name"
      return redirect_to :action => 'metadata'
    end

    metadata = config.properties.custom_dataset_metadata
    fieldset = metadata[params[:fieldset].to_i]

    fieldset['fields'] ||= []

    # No dups
    if fieldset['fields'].any? { |f| f['name'].downcase == field_name.downcase }
      flash[:error] = "You cannot create a duplicate field named '#{field_name}'"
      return redirect_to :action => 'metadata'
    end

    fieldset['fields'] << Hashie::Mash.new({ 'name' => field_name,
      'required' => false })

    save_metadata(config, metadata, "Field Successfully Created")
  end
  def delete_metadata_field
    check_auth_level('edit_site_theme')
    config = get_configuration()
    metadata = config.properties.custom_dataset_metadata
    metadata[params[:fieldset].to_i].fields.delete_at(params[:index].to_i)

    save_metadata(config, metadata, "Field Successfully Removed")
  end
  def toggle_metadata_required
    check_auth_level('edit_site_theme')
    config = get_configuration()
    metadata = config.properties.custom_dataset_metadata
    fieldset = metadata[params[:fieldset].to_i].fields

    field = fieldset[params[:index].to_i]
    field['required'] = field['required'].blank? ? true : false

    update_or_create_property(config, 'custom_dataset_metadata', metadata) do
      !config.raw_properties.key?('custom_dataset_metadata')
    end

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    respond_to do |format|
      format.data { render :json => {:success => true} }
      format.html { redirect_to :action => 'metadata' }
    end
  end
  def move_metadata_field
    check_auth_level('edit_site_theme')
    config = get_configuration()
    metadata = config.properties.custom_dataset_metadata
    fieldset = metadata[params[:fieldset].to_i].fields

    field = fieldset.detect { |f| f['name'] == params[:field] }

    index = fieldset.index(field)
    swap_index = params[:direction] == 'up' ? index-1 : index+1

    fieldset[index], fieldset[swap_index] = fieldset[swap_index], fieldset[index]

    update_or_create_property(config, 'custom_dataset_metadata', metadata) do
      !config.raw_properties.key?('custom_dataset_metadata')
    end

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    respond_to do |format|
      format.data { render :json => {:success => true, :direction => params[:direction]} }
      format.html { redirect_to :action => 'metadata' }
    end
  end

private
  def check_auth_level(level = 'manage_users')
    render_forbidden unless CurrentDomain.user_can?(current_user, level)
  end
  def check_module(mod = 'advanced_metrics')
    render_forbidden unless CurrentDomain.module_available?(mod)
  end
  def check_member
    render_forbidden unless CurrentDomain.member?(current_user)
  end

  def find_privileged_users(level=1)
    User.find :method => 'usersWithRole', :role => level
  end

  def redirect_federation(message = nil)
    flash[:notice] = message unless message.nil?
    redirect_to :action => :federations
  end

  def update_or_create_property(configuration, name, value)
    unless value.nil?
      if (yield)
        configuration.create_property(name,value)
      else
        configuration.update_property(name,value)
      end
    end
  end

  def fetch_layer_info(layer_url)
    begin
      uri = URI.parse(URI.extract(layer_url).first)
      uri.query = "f=json"
      layer_info = JSON.parse(Net::HTTP.get(uri))
    rescue SocketError, URI::InvalidURIError, JSON::ParserError
      error = "url invalid"
    end
    error = 'url invalid' if layer_info && (layer_info['error'] \
                                          || !layer_info['spatialReference'])

    if error
      return { 'error' => error }
    else
      title = layer_info['documentInfo']['Title'] if layer_info['documentInfo']
      title = uri.path.slice(uri.path.index('services')+8..-1) if title.blank?

      layer = {}
      layer['text']  = "#{title} (#{uri.host})"
      layer['value'] = uri.to_s.sub /\?.*$/, ''
      layer['data']  = { 'type' => layer_info['tileInfo'] ? 'tile' : 'dynamic' }

      return layer
    end
  end

  def get_configuration
    Configuration.find_by_type('site_theme', true, CurrentDomain.cname, false).first
  end

  def save_metadata(config, metadata, successMessage)
    update_or_create_property(config, 'custom_dataset_metadata', metadata) do
      !config.raw_properties.key?('custom_dataset_metadata')
    end

    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)

    flash[:notice] = successMessage
    redirect_to :action => 'metadata'
  end
end
