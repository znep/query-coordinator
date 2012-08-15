class ApiFoundryController < ApplicationController
  include BrowseActions
  include DatasetsHelper

  def index
    if !module_available?(:api_foundry) 
      return render_404
    end
    vtf = view_types_facet
    vtf[:options].insert(1, {
      :text => 'Unpublished Datasets', :value => 'unpublished',
      :class => 'typeUnpublished'})
    facets = [
      vtf,
      categories_facet,
      topics_facet
    ]
    @processed_browse = process_browse(request, {
      admin: true,
      browse_in_container: true,
      facets: facets,
      limit: 30,
      nofederate: true,
      view_type: 'table',
    })
  end

  def forge
    if !module_available?(:api_foundry) 
      return render_404
    end
    @view = get_view(params[:id])
    if @view.publicationStage != 'published' && @view.publicationStage != 'unpublished'
      redirect_to( :controller => 'datasets', :action => 'show', :id => params[:id])
    end
  end

protected
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
