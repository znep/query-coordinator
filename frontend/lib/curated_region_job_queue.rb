class CuratedRegionJobQueue < SocrataHttp

  class CuratedRegionJobQueue::ServerError < StandardError; end

  def enqueue_job(attributes, id, options = {})
    response_from("v1/dataset/#{id}/enqueue", options) { {:verb => :post, :data => attributes} }
  end

  def get_job_status(id, job_id, options = {})
    response_from("v1/dataset/#{id}/status/#{job_id}", options)
  end

  def get_job_log(id, job_id, options = {})
    response_from("v1/dataset/#{id}/log/#{job_id}", options)
  end

  def get_queue(params = {}, options = {})
    response_from("v1/queue?#{params.to_query}", options)
  end

  def on_failure(response, url, verb)
    Rails.logger.error("#{verb.upcase} at #{url} failed with response: #{response}")
    raise CuratedRegionJobQueue::ServerError.new(response.inspect)
  end

  def connection_details
    {
      :address => ENV['CURATED_REGION_JOB_QUEUE_HOSTNAME'] || APP_CONFIG.curated_region_job_queue_hostname,
      :port => ENV['CURATED_REGION_JOB_QUEUE_PORT'] || APP_CONFIG.curated_region_job_queue_port
    }.with_indifferent_access
  end

  private

  def response_from(endpoint, options)
    request = {
      :verb => :get,
      :headers => {
        'Content-Type' => 'application/json'
      },
      :request_id => options[:request_id],
      :cookies => options[:cookies],
      :path => endpoint
    }
    request.merge!(yield) if block_given?

    response = issue_request(request)
    response[:body]
  end

end
