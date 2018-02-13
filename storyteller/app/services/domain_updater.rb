# Updates references that use domain strings in URLS whenever Core notifies us
# about a cname/alias change.
class DomainUpdater
  class << self

    # Avoid OOMs from fetching a massive resultset of blocks; see EN-16884.
    RESULT_WINDOW_SIZE = 200

    # Various components are aware of domains, but some of them store the domain
    # at a different path in the blob than others.
    # NOTE vizCanvas components don't include federatedFromDomain
    DOMAIN_AWARE_COMPONENT_TYPES = {
      'value.link' => %w(
        image
      ),
      'value.domain' => %w(
        story.widget
        story.tile
        goal.tile
      ),
      'value.dataset.domain' => %w(
        socrata.visualization.choroplethMap
        socrata.visualization.classic
        socrata.visualization.columnChart
        socrata.visualization.comboChart
        socrata.visualization.featureMap
        socrata.visualization.histogram
        socrata.visualization.map
        socrata.visualization.pieChart
        socrata.visualization.regionMap
        socrata.visualization.table
        socrata.visualization.timelineChart
        socrata.visualization.vizCanvas
      )
    }

    FEDERATED_DOMAIN_AWARE_COMPONENTS = %w(
      socrata.visualization.choroplethMap
      socrata.visualization.classic
      socrata.visualization.columnChart
      socrata.visualization.comboChart
      socrata.visualization.featureMap
      socrata.visualization.histogram
      socrata.visualization.map
      socrata.visualization.pieChart
      socrata.visualization.regionMap
      socrata.visualization.table
      socrata.visualization.timelineChart
    )

    # Convert usages of the old domain to the new domain.
    def migrate(old_domain, new_domain)
      job_start_time = Time.current

      destination_domain = new_domain['cname']
      source_domains = old_domain.fetch('aliases', '').split(',').map(&:strip).
        concat([old_domain['cname'] == destination_domain ? nil : old_domain['cname']]).
        reject(&:blank?).uniq

      # Factoring this out into a lambda because we want to modify local state
      # but need to run this separately for two different types of query.
      offset = nil
      block_ids = []
      migrate_blocks = -> (blocks) do
        return unless blocks.present?

        ids = blocks.map(&:id)
        offset = ids.max
        block_ids += ids

        # Use a consistent timestamp and log here in case we need to correlate
        # between database records and logs.
        update_time = Time.current
        Rails.logger.info(
          "Migrating components in #{blocks.size} blocks (#{ids.sort}) " +
          "from #{source_domains.join(', ')} to #{destination_domain} at #{update_time}..."
        )

        blocks.each do |block|
          migrate_block(block, source_domains, destination_domain, update_time)
        end
      end

      # Migrate blocks retrieved with "vd" and "vdd" matchers.
      offset = 0
      begin
        candidate_blocks = candidate_blocks_using_pure_json(source_domains, offset)
        migrate_blocks.(candidate_blocks)
      end while candidate_blocks.size == RESULT_WINDOW_SIZE

      # Migrate blocks retrieved with "vl" matchers.
      offset = 0
      begin
        candidate_blocks = candidate_blocks_using_json_and_regexp(source_domains, offset)
        migrate_blocks.(candidate_blocks)
      end while candidate_blocks.size == RESULT_WINDOW_SIZE

      # Print job summary.
      block_count = block_ids.uniq.size
      if block_count > 0
        job_duration = Time.current - job_start_time
        Rails.logger.info("Component migration for domain update of #{destination_domain} updated #{block_count} blocks in #{job_duration} seconds.")
      else
        Rails.logger.info("No component migration needed for domain update of #{destination_domain}.")
      end
    end

    private

    def migrate_block(block, source_domains, destination_domain, update_time)
      new_components = block.components.map do |component|
        # Check that each component _needs_ migration, because it is possible
        # for a block to contain components associated with different domains;
        # for example, one block may have two story tiles, one pointing to
        # domain A and another pointing to domain B, and the latter should not
        # update when A changes to X!
        is_affected_component = has_domain_reference(component, source_domains)
        is_affected_federated_component = has_federated_domain_reference(component, source_domains)

        # In plain English:
        # * If the component isn't affected, return it.
        # * If the component is affected, perform the appropriate migration.
        if is_affected_component || is_affected_federated_component
          case component['type']

          when 'story.tile'
            migrate_story_tile(component, destination_domain)

          when 'goal.tile'
            migrate_goal_tile(component, destination_domain)

          when 'socrata.visualization.classic'
            # There are a multiple possible migrations here
            component = migrate_classic_visualization(component, destination_domain) if is_affected_component
            component = migrate_classic_visualization_federated_domain(component, destination_domain) if is_affected_federated_component
            component

          when 'socrata.visualization.vizCanvas'
            migrate_viz_canvas_visualization(component, destination_domain)

          when /^socrata.visualization/
            component = migrate_vif_federated_domain(component, destination_domain) if is_affected_federated_component

            vif_version = component.dig('value', 'vif', 'format', 'version').to_i
            case vif_version

            when 1
              migrate_v1_vif(component, destination_domain) if is_affected_component

            when 2
              migrate_v2_vif(component, destination_domain) if is_affected_component

            else
              error_message = 'Failed to find valid VIF version during component migration!'
              error_description = "Component structure: #{component.to_json}"
              AirbrakeNotifier.report_error(
                StandardError.new("#{error_message} #{error_description}")
              )
              component
            end

          when 'image'
            migrate_image(component, destination_domain)

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

    # Be extremely careful when adding or modifying a migration!
    # You do not want to completely muck up the component data structure!

    def migrate_story_tile(component, destination_domain)
      component.deep_merge(
        'value' => {
          'domain' => destination_domain
        }
      )
    end

    def migrate_goal_tile(component, destination_domain)
      new_url = replace_url_domain(component.dig('value', 'goalFullUrl'), destination_domain)

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

    def migrate_classic_visualization_federated_domain(component, destination_domain)
      component.deep_merge(
        'value' => {
          'dataset' => {
            'federatedFromDomain' => destination_domain
          }
        }
      )
    end

    def migrate_viz_canvas_visualization(component, destination_domain)
      component.deep_merge(
        'value' => {
          'dataset' => {
            'domain' => destination_domain
          }
        }
      )
    end

    def migrate_v1_vif(component, destination_domain)
      new_url = replace_url_domain(component.dig('value', 'vif', 'origin', 'url'), destination_domain)

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

    def migrate_vif_federated_domain(component, destination_domain)
      component.deep_merge(
        'value' => {
          'dataset' => {
            'federatedFromDomain' => destination_domain
          }
        }
      )
    end

    def migrate_image(component, destination_domain)
      new_url = replace_url_domain(component.dig('value', 'link'), destination_domain)

      component.deep_merge(
        'value' => {
          'link' => new_url
        }
      )
    end

    # Replace the domain in a URL.
    def replace_url_domain(url, domain)
      uri = Addressable::URI.parse(url)
      uri.hostname = domain
      uri.to_s
    rescue => error
      Rails.logger.error("Error replacing domain in #{url} with #{domain}: #{error}")
      uri
    end

    # Figure out whether a component refers to a source domain.
    def has_domain_reference(component, source_domains)
      domain_path = DOMAIN_AWARE_COMPONENT_TYPES.find do |(_, types)|
        types.include?(component['type'])
      end

      return false unless domain_path

      component_domain = component.dig(*domain_path.first.split('.'))
      if component_domain =~ %r{^https?://}
        # special case for things that *only* store a URL
        component_domain = Addressable::URI.parse(component_domain).hostname
      end

      source_domains.include?(component_domain)
    end

    # Figure out whether a component refers to a federated source domain.
    def has_federated_domain_reference(component, source_domains)
      return false unless FEDERATED_DOMAIN_AWARE_COMPONENTS.include?(component['type'])

      domain_path = 'value.dataset.federatedFromDomain'
      component_domain = component.dig(*domain_path.split('.'))
      source_domains.include?(component_domain)
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
    # Sadly, our components don't have a consistent way of storing the path
    # to the domain that they are based on, so we need to do the same thing
    # a few times with some slight tweaks.
    #
    #   vd = the component stores it at value.domain
    #   vdd = the component stores it at value.dataset.domain
    #   vl = the component stores it at value.link (which is a URL!)
    #
    # I apologize for the naming, but I can't think of a good semantic way to
    # describe why we have more than one convention.

    def candidate_blocks_using_pure_json(domains, offset)
      # To create the component matchers for "vd", "vfd", and "vdd", we need to generate
      # a cross product of all the affected types and all the affected domains.
      #
      # Then we format it for the containment predicate (the right side of @>).
      combine_and_format = -> ((type_hash, domain_hash)) { JSON.generate([type_hash.merge(domain_hash)]) }

      vd_type_hashes = DOMAIN_AWARE_COMPONENT_TYPES['value.domain'].map { |type| {type: type} }
      vd_domain_hashes = domains.map { |domain| {value: {domain: domain}} }
      vd_component_matchers = vd_type_hashes.product(vd_domain_hashes).map(&combine_and_format)

      vdd_type_hashes = DOMAIN_AWARE_COMPONENT_TYPES['value.dataset.domain'].map { |type| {type: type} }
      vdd_domain_hashes = domains.map { |domain| {value: {dataset: {domain: domain}}} }
      vdd_component_matchers = vdd_type_hashes.product(vdd_domain_hashes).map(&combine_and_format)

      vfd_type_hashes = FEDERATED_DOMAIN_AWARE_COMPONENTS.map { |type| {type: type} }
      vfd_domain_hashes = domains.map { |domain| {value: {dataset: {federatedFromDomain: domain}}} }
      vfd_component_matchers = vfd_type_hashes.product(vfd_domain_hashes).map(&combine_and_format)

      Block.where(
        'deleted_at IS NULL AND id > :offset AND components @> ANY (ARRAY [:matchers]::jsonb[])',
        matchers: vd_component_matchers.concat(vdd_component_matchers).concat(vfd_component_matchers),
        offset: offset
      ).order(:id).limit(RESULT_WINDOW_SIZE)
    end

    def candidate_blocks_using_json_and_regexp(domains, offset)
      # It's not possible to use only JSON manipulation functions to retrieve
      # records for the "vl" case. We have to run a separate nasty query to find
      # these affected blocks.

      vl_type_hashes = DOMAIN_AWARE_COMPONENT_TYPES['value.link'].map { |type| {type: type} }
      vl_component_matchers = vl_type_hashes.map(&JSON.method(:generate))

      # The implicit lateral join allows us to write sane WHERE conditions
      # against the values in the components column. The substring clause
      # isolates domains in URLs in order to compare against input.
      Block.find_by_sql([<<~SQL,
        SELECT DISTINCT blocks.*
        FROM blocks, jsonb_array_elements(blocks.components) block_components
        WHERE deleted_at IS NULL
          AND block_components @> ANY (ARRAY [:matchers]::jsonb[])
          AND substring(block_components#>>'{value,link}' FROM '//([^/?#]+)') IN (:domains)
          AND blocks.id > :offset
        ORDER BY blocks.id
        LIMIT :window
        SQL
        matchers: vl_component_matchers,
        domains: domains,
        offset: offset,
        window: RESULT_WINDOW_SIZE
      ])
    end
  end
end
