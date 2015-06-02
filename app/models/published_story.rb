class PublishedStory < ActiveRecord::Base
  include Immutable
  include StoryValidations
  include StoryQueries
  include BlockOperations

end
