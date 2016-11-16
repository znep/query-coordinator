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
    @goal_uid = params[:uid]

    if using_storyteller_editor?
      # This will create an in-memory draft if there is no draft story
      # in the DB (for normal stories, this would be a 404 condition.)
      @story = DraftStory.find_by_uid(@goal_uid) || DraftStory.new
      @story.uid = @goal_uid

      super
    else
      if @dashboard_uid && @category_uid
        redirect_to "/stat/goals/#{@dashboard_uid}/#{@category_uid}/#{@goal_uid}/edit-classic"
      else
        redirect_to "/stat/goals/single/#{@goal_uid}/edit-classic"
      end
    end
  end

  private

  def using_storyteller_editor?
    signaller_value = Signaller.for(flag: 'open_performance_narrative_editor').
      value(on_domain: request.host)
    url_param_value = request.params['open_performance_narrative_editor']

    (url_param_value || signaller_value) == 'storyteller'
  end

  def story_metadata
    ProcrustesStoryMetadata.new(@goal)
  end

  def load_goal
    @goal = OpenPerformance::Goal.new(params[:uid])
  end

  def story_url_for_view
    if @dashboard_uid && @category_uid
      stat_goal_url(uid: params[:uid], dashboard: @dashboard_uid, category: @category_uid)
    else
      stat_single_goal_url(uid: params[:uid])
    end
  end

  def story_url_for_preview
    if @dashboard_uid && @category_uid
      stat_preview_goal_url(uid: params[:uid], dashboard: @dashboard_uid, category: @category_uid)
    else
      stat_preview_single_goal_url(uid: params[:uid])
    end
  end
end
