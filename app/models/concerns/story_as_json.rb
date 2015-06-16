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
      attributes.
        except('id', 'uid', 'block_ids', 'deleted_at').
        merge(:id => attributes['uid'], :title => title, :blocks => blocks)
    end
  end
end
