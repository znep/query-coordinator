class CommunitiesController < SwfController
  skip_before_filter :require_user, :only => [:show]

  def show
    @body_class = 'community'
    @show_search_form = false
    
    @carousel_members = User.find({ :limit => 10 });
    @top_members = User.find({ :limit => 10 });
    @top_uploaders = User.find({ :limit => 10 });
    @all_members = User.find({ :limit => 10 });
  end

end
