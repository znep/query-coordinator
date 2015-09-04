class PublishedStory < ActiveRecord::Base
  include Immutable
  include StoryValidations
  include StoryQueries
  include BlockOperations
  include StoryAsJson

  # TODO: make this inherit from shared class
  def theme
    self[:theme] || 'classic'
  end

end
