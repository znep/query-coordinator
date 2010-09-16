# note: this is not a real controller! It just provides mixin methods.

module BrowseController

protected
  def process_browse!
    @opts = {:limit => 10, :page => 1}

    if !params[:sort].nil?
      @opts[:sortBy] = params[:sort]
    end

    # Terrible hack; but search service needs _something_ non-null; so we'll
    # search for everything!
    @opts[:q] = "''"

    @view_results = SearchResult.search('views', @opts)[0]
  end

end
