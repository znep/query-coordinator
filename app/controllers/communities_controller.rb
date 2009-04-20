class CommunitiesController < SwfController
  skip_before_filter :require_user, :only => [:show]

  def show
    @body_class = 'community'
  end

end
