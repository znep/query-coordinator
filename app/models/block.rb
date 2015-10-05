class Block < ActiveRecord::Base
  include Immutable

  # We assume a 12-column grid.
  # Given this assumption, these layouts correspond to (respectively):
  # 100%, 50%/50%, 66%/33%, 33%/66%, 33%/33%/33% and 25%/25%/25%/25%
  VALID_BLOCK_LAYOUTS = [
    '12',
    '6-6',
    '8-4',
    '4-8',
    '4-4-4',
    '3-3-3-3'
  ]

  validates :layout, presence: true, inclusion: { in: VALID_BLOCK_LAYOUTS }
  validates :components, presence: true
  validates :created_by, presence: true

  scope :for_story, ->(story) do
    where(id: story.block_ids)
  end

  # Searches the json blog for components with the specified type and only returns those blocks
  scope :with_component_type, ->(component_type) do
    json_query = [{ type: component_type }].to_json
    where("components @> ?", json_query)
  end

  after_initialize do
    (components || []).each do |component|
      next unless component['type'] == 'html'
      component['value'] = Sanitize.fragment(component['value'])
    end
  end

  def serializable_attributes
    attributes.except('id')
  end

  def as_json(options = nil)
    self.serializable_attributes
  end

  def self.from_json(json_block)
    Block.new(
      layout: json_block[:layout],
      components: json_block[:components],
      created_by: json_block[:created_by]
    )
  end

end
