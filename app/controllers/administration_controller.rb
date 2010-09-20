class AdministrationController < ApplicationController
  before_filter :check_auth_level, :except => [:analytics]
  before_filter :check_member,     :only => [:analytics]
  before_filter :check_module,     :only => [:analytics]

  # Federation permission/module checking
  before_filter :only => [:federations] do |controller|
      controller.check_auth_level('federations')
      controller.check_module('federations')
  end

  layout 'dataset_v2'

  def analytics
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
  def set_user_role
    error_message = nil
    begin
      updated_user = User.set_role(params[:userid], params[:role])
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
  end

  def sdp_templates
    @templates = WidgetCustomization.find.reject{ |t| t.hidden }
    @default_template_id = CurrentDomain.default_widget_customization_id
  end
  def sdp_set_default_template
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
    DataFederation.delete(params[:id])
    respond_to do |format|
      format.data { render :json => { :success => true } }
      format.html { redirect_federation("Federation successfully deleted") }
    end
  end
  def accept_federation
    DataFederation.accept(params[:id])
    respond_to do |format|
      format.data { render :json => { :success => true, :message => 'Accepted' } }
      format.html { redirect_federation("Federation successfully accepted") }
    end
  end
  def reject_federation
    DataFederation.reject(params[:id])
    respond_to do |format|
      format.data { render :json => { :success => true, :message => 'Rejected' } }
      format.html { redirect_federation("Federation successfully rejected") }
    end
  end
  def create_federation
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

  def check_auth_level(level = 'manage_users')
    render_forbidden unless CurrentDomain.user_can?(current_user, level)
  end

  def check_module(mod = 'advanced_metrics')
    render_forbidden unless CurrentDomain.module_available?(mod)
  end

private
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
end
