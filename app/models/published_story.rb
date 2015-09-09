class PublishedStory < ActiveRecord::Base
  include StoryValidations
  include StoryQueries
  include BlockOperations
  include StoryAsJson

  # TODO: make this inherit from shared class
  def theme
    self[:theme] || 'classic'
  end

  def self.from_draft_story(draft_story)
    params = draft_story.attributes.except(
      'id', 'created_at', 'updated_at', 'deleted_at', 'created_by'
    )
    self.new(params)
  end
end
