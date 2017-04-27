class Api::Stat::V3::GoalsController < ApplicationController
  def index
    respond_to do |format|
      format.json do
        goals_list_json
      end
      format.csv do
        goals_list_csv
      end
    end
  end

  private

  def goals_list_csv
    # TODO: We may want to revisit where this CSV is generated.

    goals = OpenPerformance::Odysseus.list_goals('csv')
    return render json: { error: true }, status: :internal_server_error unless goals.ok?

    header_row = goals.csv[0]
    link_index = header_row.index('Goal page link')
    visibility_index = header_row.index('Visibility')

    unless link_index.present? && visibility_index.present?
      return render json: {
        error: true,
        message: 'Invalid CSV header received'
      }, status: :internal_server_error
    end

    goal_ids = goals.csv.drop(1).map { |goal| goal[link_index][/\w\w\w\w-\w\w\w\w$/] }
    draft_goal_stories = drafts_for_goal_ids(goal_ids)
    published_goal_stories = published_for_goal_ids(goal_ids)

    csv_response_rows = goals.csv.each_with_index.map do |row, index|
      next row if index == 0
      next row if row[visibility_index] == 'Private'

      goal_id = goal_ids[index - 1]

      drafts = draft_goal_stories[goal_id]
      published = published_goal_stories[goal_id]

      has_been_migrated = drafts.present? || published.present?
      if has_been_migrated
        draft_time = drafts.first.created_at
        has_unpublished_draft = published.blank? || draft_time > published.first.created_at

        row[visibility_index] = has_unpublished_draft  ? 'Public (unpublished draft)' : 'Public'
      end

      row
    end

    csv_text = csv_response_rows.map { |row| CSV.generate_line(row) }.join('')
    response.headers['Content-Type'] = 'text/csv';
    render text: csv_text, status: :ok
  end

  def goals_list_json
    goals = OpenPerformance::Odysseus.list_goals
    return render json: { error: true }, status: :internal_server_error unless goals.ok?

    goal_ids = goals.json.map { |goal| goal['id'] }
    draft_goal_stories = drafts_for_goal_ids(goal_ids)
    published_goal_stories = published_for_goal_ids(goal_ids)

    json_response = goals.json.map do |goal|
      drafts = draft_goal_stories[goal['id']]
      published = published_goal_stories[goal['id']]

      goal['narrative'] = {
        'draft' => drafts.blank? ? nil : drafts.first.slice(:created_at, :created_by),
        'published' => published.blank? ? nil : published.first.slice(:created_at, :created_by)
      }
      goal
    end

    render json: json_response, status: :ok
  end

  # Returns hash mapping goal ID to list of drafts in descending created_at.
  def drafts_for_goal_ids(goal_ids)
    DraftStory.
      where(uid: goal_ids).
      order('created_at DESC').
      group_by(&:uid)
  end

  # Returns hash mapping goal ID to list of published revisions in descending created_at.
  def published_for_goal_ids(goal_ids)
    PublishedStory.
      where(uid: goal_ids).
      order('created_at DESC').
      group_by(&:uid)
  end
end
