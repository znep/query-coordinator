FactoryGirl.define do

  factory :published_story do
    four_by_four 'test-test'
    blocks []
    created_by 'test_user@socrata.com'
    created_at { Time.now }

    factory :published_story_with_blocks do
      transient do
        block_count 2
      end

      after(:build) do |story, evaluator|
        evaluator.block_count.times do
          story.blocks.push(FactoryGirl.create(:block).id)
        end
      end
    end
  end
end
