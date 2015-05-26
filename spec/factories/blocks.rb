FactoryGirl.define do

  factory :block do
    layout '12'
    components { [ { type: "text", value: "Hello, world!" } ] }
    created_by 'test_user@socrata.com'
    created_at { Time.now }
  end
end
