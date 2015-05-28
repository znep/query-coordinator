class DraftStory < ActiveRecord::Base
  include StoryValidations
  include StoryQueries
  include BlockOperations

end
