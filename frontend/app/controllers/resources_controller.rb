# To change this template, choose Tools | Templates
# and open the template in the editor.

class ResourcesController < DatasetsController
  include DatasetsHelper
  skip_before_filter :require_user, :only => [:show]

# semantic redirect
# curl --header "Accept: application/rdf+xml" http://orgd.com:9292/resource/4qsu-tpav -v -L
# curl http://orgd.com:9292/resource/addressa/d1.xml
# -L = follow link, -v = verbose
  def show
    @view = get_view_by_resource_name(params[:name])
    if (@view.nil?)
      return
    end

    row_id = params[:row_id]
    unless row_id.nil?
      row_id = CGI::escape(row_id)
      # find row sid by row identifier
      row_id = @view.get_sid_by_row_identifier(row_id)
      unless (row_id.nil?)
        row_id = row_id.strip
      end
      unless (!row_id.nil? && row_id.to_i.to_s == row_id)
        render_404
        return
      end
    end

    respond_to do |format|
      format.html {
        path = view_path(@view)
        unless row_id.nil?
          path += "/#{row_id}"
        end
        redirect_to(path, :status => 303)
      }
      format.xml { redirect_view_row(@view, row_id, 'xml') }
      format.rdf { redirect_view_row(@view, row_id, 'rdf') }
      format.json { redirect_view_row(@view, row_id, 'json') }
      format.csv { redirect_view_row(@view, row_id, 'csv') }
      format.xls { redirect_view_row(@view, row_id, 'xls') }
      format.pdf { redirect_view_row(@view, row_id, 'pdf') }
      format.rss { redirect_view_row(@view, row_id, 'rss') }
    end
  end

  protected

  # row_id can be row sid or row identifier
  def redirect_view_row(view, row_id, format)
    if (!row_id.nil?)
      row_id = "/#{row_id}"
    end
    path = "/views/#{view.id}/rows#{row_id}.#{format}?" + request.query_string

    # support more json serialization format option:
    # 1. row fields are written as json object (previously json array).
    # 2. meta (view) is not written.
    if (row_id.nil?)
      if (!request.query_string.blank?)
        path += '&'
      end
      if params[:asHashes].nil?
        path += 'asHashes=true'
      end
      if params[:meta].nil?
        path += '&meta=false'
      end
    end

    redirect_to(path, :status => 303)
  end

  def get_view_by_resource_name(name)
    begin
      view = View.find_filtered({:method => "getByResourceName", :name => name})
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
