class PublishedStory < ActiveRecord::Base
  include Immutable
  include StoryValidations
  include StoryQueries
  include BlockOperations
  include StoryTitle
  include StoryAsJson

end
