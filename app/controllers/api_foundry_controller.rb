class ApiFoundryController < ApplicationController
  include BrowseActions
  include DatasetsHelper

  def forge
    return render_404 if !module_available?(:api_foundry)
    @apiView = View.get_predeploy_api_view(params[:id])
    @view = @apiView.nil? ? get_view(params[:id]) : @apiView
    @makeNewView = @apiView.nil?
    @rnSuggestion = get_resource_name_suggestion(@view.name)
    return if @view.nil?
    redirect_to( :controller => 'datasets', :action => 'show', :id => params[:id]) if @view.publicationStage != 'published' && @view.publicationStage != 'unpublished'
  end

  def customize
    return render_404 if !module_available?(:api_foundry)
    @view = get_view(params[:id])
    @makeNewView = false
    @rnSuggestion = @view.resourceName.nil? ? get_resource_name_suggestion(@view.name) : @view.resourceName
    return if @view.nil?
    if @view.publicationStage != 'published' && @view.publicationStage != 'unpublished'
      redirect_to( :controller => 'datasets', :action => 'show', :id => params[:id]) 
    else
      render "forge"
    end
  end

  def manage 
    return render_404 if !module_available?(:api_foundry)
    @view = get_view(params[:id])
    return if @view.nil?
    if @view.publicationStage != 'published' && @view.publicationStage != 'unpublished'
      redirect_to( :controller => 'datasets', :action => 'show', :id => params[:id]) 
    end
    @parent_dataset = @view.parent_dataset
    @nav_root = '/api_foundry/manage/' + @view.id
    @section = params[:admin_section]
  end

  def setThrottle
    return render_404 if !module_available?(:api_foundry)
    method = 'setViewThrottle'
    if params['appToken'].nil?
      method = 'setViewAnonThrottle'
    end
    path = "/views/#{params[:id]}/apiThrottle.json?method=" + method + "&" + params.to_param
    coreResponse = CoreServer::Base.connection.get_request(path)
    redirect_to( :action => 'manage', :id => params[:id], :op1 => 'apps')
  end

  def rmThrottle
    return render_404 if !module_available?(:api_foundry)
    path = "/views/#{params[:id]}/apiThrottle.json?method=removeViewThrottle&" + params.to_param
    coreResponse = CoreServer::Base.connection.delete_request(path)
    respond_to do |format|
      format.html { redirect_to( :action => 'manage', :id => params[:id], :op1 => 'apps')}
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

end
