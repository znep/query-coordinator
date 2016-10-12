# Updates references that use domain strings in URLS whenever Core notifies us
# about a cname/alias change.
class DomainUpdater
  class << self

    # Various components are aware of domains, but some of them store the domain
    # at a different path in the blob than others.
    DOMAIN_AWARE_COMPONENT_TYPES = {
      'value.domain' => %w(
        story.widget
        story.tile
        goal.tile
      ),
      'value.dataset.domain' => %w(
        socrata.visualization.classic
        socrata.visualization.choroplethMap
        socrata.visualization.regionMap
        socrata.visualization.columnChart
        socrata.visualization.histogram
        socrata.visualization.pieChart
        socrata.visualization.table
        socrata.visualization.timelineChart
        socrata.visualization.featureMap
      )
    }

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
        new_components = block.components.map do |component|
          is_affected_component = has_domain_reference(component, source_domains)

          # In plain English:
          # * If the component isn't affected, return it.
          # * If the component is affected, perform the appropriate migration.
          if is_affected_component
            case component['type']

            when 'story.tile'
              migrate_story_tile(component, destination_domain)

            when 'goal.tile'
              migrate_goal_tile(component, destination_domain)

            when 'socrata.visualization.classic'
              migrate_classic_visualization(component, destination_domain)

            when /^socrata.visualization/
              vif_version = component.dig('value', 'vif', 'format', 'version').to_i
              case vif_version

              when 1
                migrate_v1_vif(component, destination_domain)

              when 2
                migrate_v2_vif(component, destination_domain)

              else
                error_message = 'Failed to find valid VIF version during component migration!'
                error_description = "Component structure: #{component.to_json}"
                AirbrakeNotifier.report_error(
                  StandardError.new("#{error_message} #{error_description}")
                )
                component
              end

            else
              error_message = 'Unknown affected component type in component migration!'
              error_description = "Type #{component['type']} is marked domain-aware but has no migration case."
              AirbrakeNotifier.report_error(
                StandardError.new("#{error_message} #{error_description}")
              )
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

    # Be extremely careful when adding or modifying a migration!
    # You do not want to completely muck up the component data structure!
    #
    # Also, be sure to check that each component _needs_ migration, because
    # it is possible for a block to contain components associated with
    # different domains; for example, one block may have two story tiles,
    # one pointing to domain A and another pointing to domain B, and the
    # latter should not update when A changes to X!

    def migrate_story_tile(component, destination_domain)
      component.deep_merge(
        'value' => {
          'domain' => destination_domain
        }
      )
    end

    def migrate_goal_tile(component, destination_domain)
      new_url = component.dig('value', 'goalFullUrl').sub(%r(//[^/]+), "//#{destination_domain}")

      component.deep_merge(
        'value' => {
          'domain' => destination_domain,
          'goalFullUrl' => new_url
        }
      )
    end

    def migrate_classic_visualization(component, destination_domain)
      component.deep_merge(
        'value' => {
          'dataset' => {
            'domain' => destination_domain
          },
          'visualization' => {
            'domainCName' => destination_domain
          }
        }
      )
    end

    def migrate_v1_vif(component, destination_domain)
      new_url = component.dig('value', 'vif', 'origin', 'url').sub(%r(//[^/]+), "//#{destination_domain}")

      component.deep_merge(
        'value' => {
          'dataset' => {
            'domain' => destination_domain
          },
          'vif' => {
            'domain' => destination_domain,
            'origin' => {
              'url' => new_url
            }
          }
        }
      )
    end

    def migrate_v2_vif(component, destination_domain)
      new_series = component.dig('value', 'vif', 'series').map do |series|
        series.deep_merge(
          'dataSource' => {
            'domain' => destination_domain
          }
        )
      end

      component.deep_merge(
        'value' => {
          'dataset' => {
            'domain' => destination_domain
          },
          'vif' => {
            'series' => new_series
          }
        }
      )
    end

    # Figure out whether a component refers to a source domain.
    def has_domain_reference(component, source_domains)
      domain_path = DOMAIN_AWARE_COMPONENT_TYPES.find do |(_, types)|
        types.include?(component['type'])
      end

      domain_path && source_domains.include?(component.dig(*domain_path.first.split('.')))
    end

    # Find blocks that have components which will be affected. The affected
    # components will encompass draft and published stories, including
    # historical versions. This migration does not create new blocks.
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
    #       '[{"type": "socrata.visualization.classic", "value": {"dataset": {"domain": "localhost"}}}]'
    #       -- and so forth, one entry per type/cname combination
    #     ]::jsonb[]);
    #
    def candidate_blocks(domains)
      # To create the component matchers, we need to generate the cross product
      # of all the affected types and all the affected domains.
      #
      # Then we format it for the containment predicate (the right side of @>).
      combine_and_format = -> ((type_hash, domain_hash)) { JSON.generate([type_hash.merge(domain_hash)]) }

      # Sadly, our components don't have a consistent way of storing the path
      # to the domain that they are based on, so we need to do the same thing
      # twice with some slight tweaks.
      #
      #   vd = the component stores it at value.domain
      #   vdd = the component stores it at value.dataset.domain
      #
      # I apologize for the naming, but I can't think of a good semantic way to
      # describe why we have more than one convention.

      vd_types = DOMAIN_AWARE_COMPONENT_TYPES['value.domain']
      vd_type_hashes = vd_types.map { |type| {type: type} }
      vd_domain_hashes = domains.map { |domain| {value: {domain: domain}} }
      vd_component_matchers = vd_type_hashes.product(vd_domain_hashes).map(&combine_and_format)

      vdd_types = DOMAIN_AWARE_COMPONENT_TYPES['value.dataset.domain']
      vdd_type_hashes = vdd_types.map { |type| {type: type} }
      vdd_domain_hashes = domains.map { |domain| {value: {dataset: {domain: domain}}} }
      vdd_component_matchers = vdd_type_hashes.product(vdd_domain_hashes).map(&combine_and_format)

      Block.where(
        'deleted_at IS NULL AND components @> ANY (ARRAY [:matchers]::jsonb[])',
        matchers: vd_component_matchers.concat(vdd_component_matchers)
      )
    end
  end
end
