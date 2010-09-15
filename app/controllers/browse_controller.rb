# note: this is not a real controller! It just provides mixin methods.

module BrowseController

protected
  def process_browse!
    opts = {:limit => 10, :page => 1}
    @views = View.find(opts, true)
  end

end
