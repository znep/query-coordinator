class ApiFoundryController < ApplicationController
  include BrowseActions
  include DatasetsHelper

  def forge
    return render_404 if !module_available?(:api_foundry)
    @view = get_view(params[:id])
    @makeNewView = true
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
