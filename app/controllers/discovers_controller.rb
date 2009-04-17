class DiscoversController < SwfController

  def show
    @body_class = 'discover'
    @show_search_form = false
    
    # TODO: Make all views return ALL public blists.
    @all_views = View.find()
    
    @popular_views = View.find_popular()
    @carousel_views = View.find_popular()[0,2]
    @network_views = View.find_popular()[0,5]
    
    @fun_views = @all_views.find_all { |v| v.category == "fun" }
    @personal_views = @all_views.find_all { |v| v.category == "personal" }
    @business_views = @all_views.find_all { |v| v.category == "business" }
    @education_views = @all_views.find_all { |v| v.category == "education" }
  end

  def swf
    @body_id = 'discoverBody'
    @body_class = 'discover'
    @start_screen = 'discover'
    @discover_search = params[:search]
    @swf_url = swf_url('v3embed.swf')
    
    render(:template => "discovers/show_swf")
  end

end
