FactoryGirl.define do

  factory :block do
    layout '12'
    components { [ { type: 'html', value: 'Hello, world!' } ] }
    created_by 'test_user@socrata.com'
    presentable true

    factory :block_with_image do
      components { [ { type: 'image', value: { documentId: 1, url: 'http://example.com/image.jpg' } } ] }
    end

    factory :block_with_hero do
      components { [ { type: 'hero', value: { documentId: 2, url: 'http://example.com/hero-image.jpg' } } ] }
    end

    factory :block_with_author do
      components do
        [{
          type: 'author',
          value: {
            image: {
              documentId: 3,
              url: 'http://example.com/hero-image.jpg'
            }
          }
        }]
      end
    end

    factory :block_with_legacy_getty_image do
      components {
        [
          { type: 'image', value: { documentId: nil, url: '/stories/api/v1/getty-images/things234' } },
          { type: 'hero', value: { url: '/stories/api/v1/getty-images/2392020' } },
          { type: 'author', value: { blurb: 'Hello!', image: { url: '/stories/api/v1/getty-images/203920', documentId: nil } } }
        ]
      }
    end

    factory :block_with_getty_image do
      components {
        [
          { type: 'hero', value: { url: '/stories/api/v1/getty-images/2392020' } },
          { type: 'author', value: { blurb: 'Hello!', image: { url: '/stories/api/v1/getty-images/203920', documentId: nil } } }
        ]
      }
    end
  end
end
