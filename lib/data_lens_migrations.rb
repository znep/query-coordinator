class DataLensMigrations

  class DataLensMigrationException < StandardError
  end

  # The first two versions are noops because we were not using this migration
  # system for the first two page metadata versions.
  def self.active_migrations
    {
      1 => lambda { |page_metadata, _|
        page_metadata
      },

      2 => lambda { |page_metadata, _|
        page_metadata
      },

      3 => lambda { |page_metadata, options|
        return page_metadata if page_metadata[:cards].blank?

        # Fetch columns for dataset, which are used to read computed columns
        begin
          dataset_id = page_metadata[:datasetId]
          dataset_columns = page_metadata_manager.fetch_dataset_columns(dataset_id, options)
        rescue => ex
          raise DataLensMigrationException.new("Unable to fetch columns for dataset '#{dataset_id}', exception: '#{ex}'")
        end

        # If a card's fieldName is a computed column, change its fieldName to be
        # the computed column's source column and add a computedColumn property
        # to the card referencing the name of the computed column. Operate on a
        # copy so that the cards are not left in a half-migrated state in the
        # event of a failure.
        page_metadata[:cards] = page_metadata[:cards].map { |card|
          card = card.dup

          if card[:cardType] == 'choropleth' && card[:computedColumn].blank?
            computed_column_name = card[:fieldName]
            computed_column = dataset_columns[computed_column_name.to_sym]

            source_columns = computed_column && computed_column[:computationStrategy] && computed_column[:computationStrategy][:source_columns]
            if source_columns.blank?
              raise DataLensMigrationException.new("No source columns for computed column '#{computed_column_name}'")
            end

            card[:computedColumn] = computed_column_name
            card[:fieldName] = source_columns.first
          end

          card
        }

        page_metadata
      },

      4 => lambda { |page_metadata, options|
        return page_metadata if page_metadata.blank?
        return page_metadata if page_metadata[:cards].blank?

        page_metadata[:cards] = page_metadata[:cards].map { |card|
          card.reverse_merge({
            :aggregationField => page_metadata[:primaryAmountField],
            :aggregationFunction => page_metadata[:primaryAggregation]
          })
        }
        
        page_metadata
      }
    }
  end

  def self.page_metadata_manager
    @page_metadata_manager ||= PageMetadataManager.new
  end
end
