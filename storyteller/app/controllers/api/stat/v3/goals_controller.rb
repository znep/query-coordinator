class Api::Stat::V3::GoalsController < ApplicationController
  def index
    #TODO csv
    goals = OpenPerformance::Odysseus.list_goals
    return render json: { error: true }, status: :internal_server_error unless goals.ok?

    # NOTE: Goals from Odysseus should use the 'id' property. Stories uses 'uid', 'id' means something else.
    goal_ids = goals.json.map { |goal| goal['id'] }
    draft_goal_stories = DraftStory.
      where(uid: goal_ids).
      order('created_at DESC').
      group_by(&:uid)
    published_goal_stories = PublishedStory.
      where(uid: goal_ids).
      order('created_at DESC').
      group_by(&:uid)

    response = goals.json.map do |goal|
      drafts = draft_goal_stories[goal['id']]
      published = published_goal_stories[goal['id']]

      goal['narrative'] = {
        'draft' => drafts.blank? ? nil : drafts.first.slice(:created_at, :created_by),
        'published' => published.blank? ? nil : published.first.slice(:created_at, :created_by)
      }
      goal
    end
    render json: response, status: :ok
  end
end
