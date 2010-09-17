# note: this is not a real controller! It just provides mixin methods.

module BrowseController

protected
  def process_browse!
    @opts = {:limit => 10, :page => (params['page'] || 1).to_i}
    @params = params.reject {|k, v| k == 'controller' || k == 'action'}
    @base_url = request.env['REQUEST_PATH']

    if !params[:sortBy].nil?
      @opts[:sortBy] = params[:sortBy]
    end


    # Terrible hack; but search service needs _something_ non-null; so we'll
    # search for everything!
    @opts[:q] = "''"

    @view_results = SearchResult.search('views', @opts)[0]
  end

end
