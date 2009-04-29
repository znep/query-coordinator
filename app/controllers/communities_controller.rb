class CommunitiesController < SwfController
  skip_before_filter :require_user, :only => [:show]

  def show
    @body_class = 'community'
    @show_search_form = false
    
    @carousel_members = User.find();
    @top_members = User.find();
    @top_uploaders = User.find();
    @all_members = User.find();
  end

end
