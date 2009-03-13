class DiscoversController < SwfController
  def show
    @body_id = 'discoverBody'
    @body_class = 'discover'
    @start_screen = 'discover'
    @discover_search = params[:search]
    @swf_url = swf_url('v3embed.swf')
  end

end
