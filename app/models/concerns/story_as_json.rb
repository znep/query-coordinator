module StoryAsJson
  extend ActiveSupport::Concern

  included do

    def as_json(options = nil)
      serializable_attributes.transform_keys do |key|
        key.to_s.camelize(:lower)
      end
    end

    private

    def serializable_attributes
      attributes.except('id', 'block_ids', 'deleted_at').merge(:title => title, :blocks => blocks)
    end
  end
end
