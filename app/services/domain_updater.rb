# Updates references that use domain strings in URLS whenever Core notifies us
# about a cname/alias change.
class DomainUpdater
  class << self

    # Convert usages of the old domain to the new domain.
    def migrate(old_domain, new_domain)
      source_domains = old_domain.fetch('aliases', '').
        split(',').map(&:strip).reject(&:empty?).concat([old_domain['cname']]).uniq
      destination_domain = new_domain['cname']
      affected_blocks = candidate_blocks(source_domains)
      if affected_blocks.empty?
        Rails.logger.info("No component migration needed for domain update of #{destination_domain}.")
        return
      end

      # Use a consistent timestamp and log here in case we need to correlate
      # between database records and logs.
      update_time = Time.current
      Rails.logger.info(
        "Migrating components in #{affected_blocks.size} blocks (#{affected_blocks.map(&:id).sort}) " +
        "from #{source_domains.join(', ')} to #{destination_domain} at #{update_time}..."
      )

      affected_blocks.each do |block|
        # Be extremely careful when adding or modifying a migration!
        # You do not want to completely muck up the component data structure!
        #
        # Also, be sure to check that each component _needs_ migration, because
        # it is possible for a block to contain components associated with
        # different domains; for example, one block may have two story tiles,
        # one pointing to domain A and another pointing to domain B, and the
        # latter should not update when A changes to X!
        #
        # No new blocks are created. Affected components will encompass draft
        # and published stories, including historical versions.
        new_components = block.components.map do |component|
          case component['type']

          when 'story.tile'
            if source_domains.include?(component.dig('value', 'domain'))
              component.deep_merge!(
                'value' => {
                  'domain' => destination_domain
                }
              )
            else
              component
            end

          when 'goal.tile'
            if source_domains.include?(component.dig('value', 'domain'))
              new_url = component.dig('value', 'goalFullUrl').sub(%r(//[^/]+), "//#{destination_domain}")
              component.deep_merge!(
                'value' => {
                  'domain' => destination_domain,
                  'goalFullUrl' => new_url
                }
              )
            else
              component
            end

          else
            component
          end
        end

        block.update_columns(components: new_components, updated_at: update_time)
      end
    end

    private

    # Find blocks that have components which will be affected.
    #
    # If you want to understand the query syntax, read these pages:
    #
    #   - https://www.postgresql.org/docs/9.4/static/functions-json.html
    #   - https://dba.stackexchange.com/questions/130699/
    #
    # The generated SQL will resemble the following:
    #
    #   SELECT *
    #   FROM blocks
    #   WHERE deleted_at IS NULL
    #     AND components @> ANY (ARRAY [
    #       '[{"type": "story.tile", "value": {"domain": "localhost"}}]',
    #       '[{"type": "goal.tile", "value": {"domain": "localhost"}}]'
    #     ]::jsonb[]);
    #
    def candidate_blocks(domains)
      # To create the component matchers, we need to generate the cross product
      # of all the affected types and all the affected domains.
      # Then we format it for the containment predicate (the right side of @>).
      type_hashes = %w(story.tile goal.tile).map { |type| {type: type} }
      domain_hashes = domains.map { |domain| {value: {domain: domain}} }
      component_matchers = type_hashes.product(domain_hashes).map do |(type_hash, domain_hash)|
        JSON.generate([type_hash.merge(domain_hash)])
      end

      Block.where(
        'deleted_at IS NULL AND components @> ANY (ARRAY [:matchers]::jsonb[])',
        matchers: component_matchers
      )
    end
  end
end
