FactoryGirl.define do
  factory :curated_region do
    sequence(:id)
    sequence(:name) { |n| "Region #{n}" }
    defaultFlag false
    enabledFlag false

    trait :enabled do
      enabledFlag true
    end

    trait :disabled do
      enabledFlag false
    end

    trait :default do
      defaultFlag true
    end
  end
end
