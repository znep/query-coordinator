FactoryGirl.define do

  factory :published_story do
    four_by_four 'test-test'
    blocks []
    created_by 'test_user@socrata.com'
    created_at { Time.now }

    factory :published_story_with_block do
      blocks [ bulid(:block) ]
    end
  end
end
