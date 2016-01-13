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

  # Using our own config because it's more restrictive than the ones Sanitize provides.
  SANITIZE_CONFIG = {}
  SANITIZE_CONFIG['html'] = {
    :elements => %w(
      h1 h2 h3 h4 h5 h6
      div blockquote
      ol ul li
      b i em
      a p br
    ),
    :attributes => {
      :all => [ 'class', 'style' ],
      'a' => [ 'href', 'target', 'rel' ]
    },
    :properties => 'text-align'
  }

  after_initialize do
    if components.is_a?(Array)
      (components || []).each do |component|

        # Because Rails will automatically convert empty arrays to nils in JSON
        # objects accessed from the `param` hash (see:
        # https://github.com/rails/rails/pull/8862), we need to go back and
        # unmunge the `filters` property of any vif found in a component back
        # to an empty array (VIF specifies that `filters` is always an array,
        # and we run the risk of breaking things downstream that actually
        # conform to the spec if we start persisting invalid VIFs).
        #
        # This code is also run when returning results from the database,
        # ensuring that even old vifs that were saved with the incorrect null
        # value for the `filters` key will be 'migrated' to the correct format
        # on page load, and therefore on the next save (all blocks are saved
        # every time regardless of whether they have changed).
        #
        # In practice, we determine if this 'migration' is necessary by
        # asserting that the 'vif' property of the value exists and has a
        # 'filters' key, but the value of the 'filters' key value is nil.
        vif_or_nil = component.try(:[], 'value').try(:[], 'vif')

        if (
          vif_or_nil.present? &&
          vif_or_nil.is_a?(Hash) &&
          vif_or_nil.has_key?('filters') &&
          vif_or_nil['filters'].nil?
        )
          component['value']['vif']['filters'] = []
        end

        # We had some old code where blocks were not saved properly.
        # This prevents breakage if loading those blocks' components
        if component['type'] == 'html' && component.has_key?('value')
          component['value'] = Sanitize.fragment(
            component['value'],
            SANITIZE_CONFIG['html']
          )
        end
      end
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
