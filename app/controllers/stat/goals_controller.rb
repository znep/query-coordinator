# Mostly blank controller for use in differentiating permissions.
# Can handle special cases of redirection as well.
class Stat::GoalsController < StoriesController

  def show
    redirect_to "#{request.path.sub('/stories', '')}/view"
    # TODO: call super instead of redirecting if we have a storyteller-backed goal
  end
end
