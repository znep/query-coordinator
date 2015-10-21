module Services
  module DataLens
    class RegionCodingStatusChecker
      include ::Services::DataLens::RegionCodingHelpers

      def complete?(shapefile_id, dataset_id)
        curated_region = CuratedRegion.find_by_view_id(shapefile_id)
        view = View.find(dataset_id)
        if has_working_copy?(view)
          working_copy = View.find(view.unpublished_dataset.id)
          computed_column_name = region_column_field_name(curated_region.uid)
          if has_computed_column?(working_copy, computed_column_name) &&
            !has_computed_column?(view, computed_column_name)
            return false
          else
            return !has_computed_column?(view, computed_column_name)
          end
        end
        response = get_selection(view.id)
        !data_out_of_date?(response)
      end

      private

      def data_out_of_date?(response)
        header = 'x-soda2-data-out-of-date'
        return false unless response_has_header?(response, header)
        response[:headers][header] == 'true'
      end

      def response_has_header?(response, header)
        headers = response[:headers]
        headers.has_key?(header)
      end

      def get_selection(id)
        http.get_selection(id)
      end

      def http
        @http ||= Http.new
      end


      class Http < SocrataHttp

        def get_selection(id, options = {})
          query = {
            '$query' => "select 0 as bust#{Time.now.to_i} limit 1"
          }
          issue_request(
            :verb => :get,
            :path => "id/#{id}.json?#{query.to_query}",
            :request_id => options[:request_id],
            :cookies => options[:cookies]
          )
        end

        private

        def port
          CORESERVICE_URI.port
        end

        def address
          CORESERVICE_URI.host
        end

        def pass_through_headers
          nil
        end

      end


    end
  end
end
