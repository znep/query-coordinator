class AdminController < ApplicationController
  include AdminHelper

  before_filter :check_auth,        :except => [:index, :theme, :update_theme, 
    :sdp_index, :sdp, :update_sdp, :hide_template, :create_customization, 
    :new_customization, :create_blank_dataset]
  before_filter :check_designer,    :only => [:index, :theme, :update_theme]
  before_filter :check_edit_sdp,    :only => [:sdp_index, :sdp, :hide_template,
    :create_customization, :new_customization]
  before_filter :check_create_data, :only => :create_blank_dataset

  def index
  end

  def config
    session[:return_to] = url_for(:action => :config)

    @features = Domain.configurable_features.map do |feature|
      {:name => feature, :enabled => CurrentDomain.features[feature] || false}
    end
    @features.sort! { |a, b| a[:name] <=> b[:name] } unless @features.nil?

    @modules = CurrentDomain.modules.select { |mod|
      Domain.flippable_modules.include?(mod['name']) }.map do |m|
        { :name => m['name'], :description => m['description'],
          :enabled => CurrentDomain.features[m['name']] }
    end
    @modules.sort! { |a, b| a[:name] <=> b[:name] } unless @modules.nil?

    @comment_modules = CurrentDomain.modules.select { |mod|
      Domain.comment_modules.include?(mod['name']) }.map do |c|
        {:name => c['name'], :description => c['description'],
          :enabled => CurrentDomain.features[c['name']] }
    end

    # HACK: Our comment system isn't one-hot, so we have to make a disable option
    @comment_modules.insert(0, :name => '0', :description => 'Disable Comments', 
        :enabled => CurrentDomain.features['allow_comments'] == false)

    @strings = CurrentDomain.strings.select { |k,v| Domain.configurable_strings.include?(k) }
    @strings.sort! { |a, b| a[0] <=> b[0] } unless @strings.nil?

    # Finally load any custom strings, e.g. email.from_address
    @site_theme_options = Domain.site_theme_options.map do |option|
      {:name => option[:name], :value => CurrentDomain.raw_properties[option[:name]],
         :description => option[:description] }
    end
    @site_theme_options.sort! { |a, b| a[:name] <=> b[:name] } unless @site_theme_options.nil?
  end

  def update_config
    # Grab the unmerged versions so we can tell what keys to *create* rather than update
    feature_set = configuration = nil
    CoreServer::Base.connection.batch_request do
      feature_set   = Configuration.find_by_type('feature_set', true, request.host, false)[0]
      configuration = Configuration.find_by_type('site_theme',  true, request.host, false)[0]
    end

    error_message = nil
    begin
      # Wrap it in one big, cuddly batch request
      CoreServer::Base.connection.batch_request do
        unless params[:strings].blank?
          params[:strings].each do |name, value|
            if(Domain.configurable_strings.include?(name))
              update_or_create_property(configuration, "strings.#{name}", value) do
                configuration.properties.strings[name].nil?
              end
            end
          end
        end

        unless params[:options].blank?
          params[:options].each do |name, value|
            if Domain.site_theme_options.any? {|opt| opt[:name] == (name)}
              update_or_create_property(configuration, name, value) do
                configuration.raw_properties[name].nil?
              end
            end
          end
        end

        create_or_update_from_form(feature_set,
          Domain.flippable_modules, params[:modules])

        create_or_update_from_form(feature_set,
          Domain.configurable_features, params[:features])

        comment_config = {
          'allow_comments' => true,
          'community_comment_moderation' => false,
          'publisher_comment_moderation' => false
        }
        # HACK: There is no 'disable_comments' flag, so we have this
        if params[:comments] == '0'
          comment_config['allow_comments'] = false
        else
          comment_config[params[:comments]] = true
        end

        comment_config.each do |name, value|
          if CurrentDomain.modules.any? { |m| m['name'] == name }
            update_or_create_property(feature_set, name, value) do
              feature_set.properties[name].nil?
            end
          end
        end
      end
    rescue CoreServer::CoreServerError => ex
      error_message = ex.error_message
    end

    if error_message.nil?
      flash[:notice] = 'Configuration saved'
    else
      flash.now[:error] = "Error saving configuration: #{error_message}"
      return (render 'shared/error', :status => :not_found)
    end

    CurrentDomain.flag_preferences_out_of_date!
    redirect_to :action => :config
  end

  def theme
    session[:return_to] = url_for(:action => :theme)
    configuration = Configuration.find_by_type('site_theme', true, request.host)[0]
    @theme = configuration.properties.theme
    @configID = configuration.data['id']
  end

  def update_theme
    if params[:configID].present?
      configuration = Configuration.find_unmerged(params[:configID])

      # Logic goes here ...

      # !! Note: We might not be working on the active theme, need more LOGIC
      CurrentDomain.flag_preferences_out_of_date!
    end
    redirect_to :action => :theme
  end

  def users
    @roles_list = User.roles_list
    if !params[:username].blank?
      @search = params[:username]
      @user_search_results= User.find :name => params[:username]
    else
      @admins = find_privileged_users.sort{|x,y| x.displayName <=> y.displayName}
    end
  end

  def save_user_role
    # Updating a user's permissions via POST
    if params[:id] && params[:role].present?
      success = false
      error_message = nil
      begin
        updated_user = User.set_role(params[:id], params[:role])
      rescue CoreServer::CoreServerError => ex
        error_message = ex.error_message
      end
      if params[:role] == '0'
        success = updated_user && updated_user.roles.nil?
      else
        success = updated_user && updated_user.roles &&
          updated_user.roles.include?(params[:role])
      end
      flash[:notice] = success ?
        "User '#{updated_user.displayName}' successfully saved" :
        "Error saving user. #{error_message}"
    end
    redirect_to :action => :users
  end
  
  def reload
    # Note!! This only reloads for the current server. We need to
    # re-think our CurrentDomain caching scheme if we want real-time refresh
    CurrentDomain.reload(request.host)
    redirect_back_or_default(url_for :action => :index)
  end

  def sdp_index
    session[:return_to] = url_for(:action => :sdp_index)

    @view = find_example_view
    @preview_options = @@preview_options
 
    @widget_customizations = WidgetCustomization.find.select {|w| !w.hidden}

    if @widget_customizations.empty?
      @widget_customization = WidgetCustomization.create_default!
      @widget_customizations = [@widget_customization]
      CurrentDomain.set_default_widget_customization_id(@widget_customization.uid)
    else
      @widget_customizations.sort!{|a,b| a.name <=> b.name}
    end
    
    @default_template = CurrentDomain.default_widget_customization_id
  end

  def sdp
    unless params[:id].present? && params[:customization_id].present?
      flash.now[:error] = 'Please choose a template to edit'
      return (render 'shared/error', :status => :not_found)
    end

    begin
      @view = View.find(params[:id])
    rescue CoreServer::ResourceNotFound
        flash.now[:error] = 'This ' + I18n.t(:blist_name).downcase +
          ' cannot be found, or has been deleted.'
        return (render 'shared/error', :status => :not_found)
      return
    end

    begin
      @widget_customization = WidgetCustomization.find(params[:customization_id])
      @customization = WidgetCustomization.merge_theme_with_default(@widget_customization.customization)
    rescue CoreServer::ResourceNotFound
        flash.now[:error] = 'This template customization cannot be found'
        return (render 'shared/error', :status => :not_found)
      return
    end

    @done_href = url_for(:controller => 'admin', :action => 'sdp_index')
    @hide_template_select = true
    @admin_panel = true
    render 'blists/publish'
  end
  
  def set_default_template
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

    CurrentDomain.flag_preferences_out_of_date!
    redirect_to :action => :sdp_index
  end

  def hide_template
    begin
      @customization = WidgetCustomization.find(params[:id])
    rescue CoreServer::ResourceNotFound
        flash.now[:error] = 'This template customization cannot be found.'
        return (render 'shared/error', :status => :not_found)
      return
    end

    # Don't actually delete it, just don't show it in the UI
    @customization.hidden = true
    @customization.save!
    redirect_to :action => :sdp_index
  end

  def create_blank_dataset
    dataset = View.create(:name => "Blank #{CurrentDomain.strings.company} dataset")
    flash[:notice] = "Blank dataset created"
    redirect_to :action => :sdp_index
  end

  def new_customization
    @widget_customizations = WidgetCustomization.find.select do |w|
      !w.hidden && w.customization[:version] == 1
    end

    example_view = find_example_view()
    @return_to = "/admin/sdp/#{example_view.id}"
    respond_to do |format|
      format.data { render 'blists/new_customization', :layout => 'modal_dialog' }
    end
  end

  def verify_layer_url
    response = fetch_layer_info(params[:url])
    respond_to do |format| format.data { render :json => response.to_json } end
  end

#  # TODO: Abandoned this functionality since we're not going to add domain-level
#  # custom layers quite yet. This action still needs to be hooked into permissions.
#  def add_custom_layer
#    layer = fetch_layer_info(params[:url])
#
#    config = Array(Configuration.find_by_type("custom_layers", true)).first
#    config = Configuration.create({ 'type' => 'custom_layers', 'name' => 'Custom Layers', 'default' => true }) unless config
#
#    unless layer[:error]
#      layers = config.properties['esri']
#      method = layers ? :update_property : :create_property
#      config.send(method, 'esri', Array(layers) << layer)
#    end
#    respond_to do |format| format.data { render :text => config.to_s } end
#  end

private
  def check_auth(level = 'manage_users')
    unless CurrentDomain.user_can?(current_user, level)
      flash.now[:error] = "You do not have permission to view this page"
      return (render 'shared/error', :status => :forbidden)
    end
  end
  
  def check_designer
    check_auth(:edit_site_theme)
  end

  def check_edit_sdp
    check_auth(:edit_sdp)
  end

  def check_create_data
    check_auth(:create_datasets)
  end

  def find_privileged_users(level=1)
    User.find :method => 'usersWithRole', :role => level
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

  def create_or_update_from_form(config, whitelist, form_values, enabled='enabled')
    if form_values
      form_values[:name].each do |name, value|
        if(whitelist.include?(name))
          if config.raw_properties[name].nil?
            config.create_property(name, form_values[:enabled].present? &&
              form_values[:enabled][name] == enabled)
          else
            config.update_property(name, form_values[:enabled].present? &&
              form_values[:enabled][name] == enabled)
          end
        end
      end
    end
  end

  def find_example_view
    # Get a sample dataset to use
    views = View.find(:public_only => true, :limit => 1)
    return views.first unless views.nil?
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

  @@preview_options = {:height => '280', :width => '500'}
end
