# Mostly blank controller for use in differentiating permissions.
# Can handle special cases of redirection as well.
class Stat::GoalsController < StoriesController
  before_action :load_goal
  before_action :load_story_metadata # enforce order - this depends on load_goal

  def show
    redirect_to "#{request.path.sub('/stories', '')}/view"
    # TODO: call super instead of redirecting if we have a storyteller-backed goal
  end

  def edit
    @dashboard_uid = params[:dashboard]
    @category_uid = params[:category]

    # This will create an in-memory draft if there is no draft story
    # in the DB (for normal stories, this would be a 404 condition.)
    @story = DraftStory.find_by_uid(params[:uid]) || DraftStory.new
    @story.uid = params[:uid]

    super
  end

  private

  def story_metadata
    ProcrustesStoryMetadata.new(@goal)
  end

  def load_goal
    @goal = OpenPerformance::Goal.new(params[:uid])
  end

  def story_view_url
    if @dashboard_uid && @category_uid
      stat_goal_url(uid: params[:uid], dashboard: @dashboard_uid, category: @category_uid)
    else
      stat_single_goal_url(uid: params[:uid])
    end
  end
end
