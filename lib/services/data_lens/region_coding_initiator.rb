module Services
  module DataLens
    class RegionCodingInitiator
      include ::Services::DataLens::RegionCodingHelpers

      def initiate(shapefile_id, dataset_id, source_column_name)
        curated_region = CuratedRegion.find_by_view_id(shapefile_id)
        view = View.find(dataset_id)

        return if has_computed_column?(view, region_column_field_name(curated_region.uid))

        if has_working_copy?(view)
          working_copy = View.find(view.unpublished_dataset.id)
          if has_computed_column?(working_copy, region_column_field_name(curated_region.uid))
            raise RegionCodingError.new('A column is already being region coded for this dataset')
          end
        else
          working_copy = make_working_copy(view)
        end

        execute_region_coding(working_copy, curated_region, source_column_name)
      end

      private

      def execute_region_coding(working_copy, curated_region, source_column_name)
        payload = {
          :name => curated_region.name,
          :dataTypeName => 'number',
          :fieldName => region_column_field_name(curated_region.uid),
          :computationStrategy => {
            :type => 'georegion_match_on_point',
            :recompute => true,
            :source_columns => [source_column_name],
            :parameters => {
              :region => "_#{curated_region.uid}",
              :primary_key => curated_region.featurePk
            }
          }
        }

        post_computed_column(payload, working_copy)
        publish_working_copy(working_copy)
      end

      def post_computed_column(payload, working_copy)
        make_request(path(working_copy), payload)
      rescue => ex
        error_message = "An error occurred while creating computed column: #{ex}"
        Airbrake.notify(
          :error_class => 'ComputedColumnCreationError',
          :error_message => error_message
        )

        Rails.logger.warn(error_message)
        delete_working_copy(working_copy)
        raise RegionCodingError.new('An error occurred while creating computed column')
      end

      def publish_working_copy(working_copy)
        working_copy.publish
      rescue => ex
        error_message = "An error occurred while publishing working copy: #{ex}"
        Airbrake.notify(
          :error_class => 'WorkingCopyPublishError',
          :error_message => error_message
        )
        Rails.logger.warn(error_message)
      end

      def delete_working_copy(working_copy, tries = 3)
        working_copy.delete
      rescue => ex
        tries -= 1
        Rails.logger.warn('Deleting working copy failed, retrying in 1 second') if tries > 0
        sleep 1
        retry if tries > 0
        error_message = "An error occurred while deleting working copy: #{ex}"
        Airbrake.notify(
          :error_class => 'WorkingCopyDeletionError',
          :error_message => error_message
        )
        Rails.logger.warn(error_message)
      end

      def make_request(path, payload)
        View.parse(CoreServer::Base.connection.create_request(path, payload.to_json, {}, false, nil, false, 300))
      end

      def make_working_copy(view)
        view.make_unpublished_copy
      rescue => ex
        error_message = "Unable to create working copy for this dataset: #{ex}"
        Airbrake.notify(
          :error_class => 'WorkingCopyCreationError',
          :error_message => error_message
        )
        Rails.logger.warn(error_message)
        raise RegionCodingError.new('Unable to create working copy for this dataset')
      end

      def path(view)
        "/views/#{view.id}/columns"
      end

    end
  end
end
