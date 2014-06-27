class ApiFoundryController < ApplicationController
  include BrowseActions
  include DatasetsHelper

  def forge
    @apiView = View.get_predeploy_api_view(params[:id])
    @view = @apiView.nil? ? get_view(params[:id]) : @apiView
    return if !has_api_permission?
    @makeNewView = true
    @rnSuggestion = get_resource_name_suggestion(@view.name)
    redirect_to( :controller => 'datasets', :action => 'show', :id => params[:id]) if @view.publicationStage != 'published' && @view.publicationStage != 'unpublished'
  end

  def customize
    @view = get_view(params[:id])
    return if !has_api_permission?
    @makeNewView = false
    @rnSuggestion = @view.resourceName.nil? ? get_resource_name_suggestion(@view.name) : @view.resourceName
    render "forge"
  end

  def manage 
    @view = get_view(params[:id])
    return if !has_api_permission?
    @parent_dataset = @view.parent_dataset
    @nav_root = '/api_foundry/manage/' + @view.id
    @section = params[:admin_section]
    if @section == 'apps_edit'
      @throttles = @view.find_api_throttles()
      tok = params[:token]
      if tok == "anonymous"
        @throttle = @view.find_api_anonymous_throttle()
      else
        @throttle = @throttles.detect{|t| t.appToken == params[:token] }
      end

      if tok != 'new' and tok != 'anonymous' && @throttle.nil?
        return render_404
      end
    end
  end

  def setThrottle
    return render_404 if !module_enabled?(:api_foundry)
    method = 'setViewThrottle'
    if params['appToken'].nil?
      method = 'setViewAnonThrottle'
    end
    path = "/views/#{params[:id]}/apiThrottle.json?method=" + method + "&" + params.to_param
    begin
      coreResponse = CoreServer::Base.connection.get_request(path)
    rescue CoreServer::CoreServerError => e
      flash[:error] = e.error_message
      redirect_to :action => 'manage', :admin_section => "apps_edit", :token => "new"
      return
    end
    redirect_to( :action => 'manage', :id => params[:id], :admin_section => 'apps_list')
  end

  def rmThrottle
    return render_404 if !module_enabled?(:api_foundry)
    path = "/views/#{params[:id]}/apiThrottle.json?method=removeViewThrottle&" + params.to_param
    coreResponse = CoreServer::Base.connection.delete_request(path)
    respond_to do |format|
      format.html { redirect_to( :action => 'manage', :id => params[:id], :admin_section => 'apps_list')}
      format.data { render :text => "{}" }
    end
  end


protected
  def get_resource_name_suggestion(name)
    return name.downcase.gsub(/[^a-z0-9]/, "-").gsub(/-+/, "-")
  end

  def get_view(id)
    begin
      view = View.find(id)
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This dataset or view cannot be found, or has been deleted.'
      render 'shared/error', :status => :not_found
      return nil
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required'
        require_user(true)
        return nil
      elsif e.error_code == 'permission_denied'
        render_forbidden(e.error_message)
        return nil
      else
        flash.now[:error] = e.error_message
        render 'shared/error', :status => :internal_server_error
        return nil
      end
    end

    if (view.is_form? ? !view.can_add? : !view.can_read?)
      render_forbidden("You do not have permission to view this dataset")
      return nil
    end

    return view
  end

private

  def has_api_permission?()
    if @view.nil?
      #if the view is nil, the get_view will already have rendered a 404
      return false
    elsif !module_enabled?(:api_foundry)
      render_404()
      return false
    elsif @view.publicationStage != 'published' && @view.publicationStage != 'unpublished'
      redirect_to( :controller => 'datasets', :action => 'show', :id => params[:id]) 
      return false
    elsif @current_user.nil? || !@view.has_rights?('update_view')
      render_forbidden("You do not have permission to view this dataset")
      return false
    end
    return true
  end
end
