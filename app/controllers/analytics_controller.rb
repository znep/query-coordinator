class AnalyticsController < ApplicationController
  skip_before_filter :require_user
  skip_before_filter :verify_authenticity_token, :only => [:add, :add_all]

  def index
    if !CurrentDomain.feature? :public_site_metrics
      return render_404
    end
  end

  def add_all
    data = ActiveSupport::JSON.decode(request.body)
    metrics = data["metrics"]
    metrics.each { |m|
      valid, error = add_metric(m['entity'], m['metric'], m['increment'])
      return render_metric_error(error) unless valid
    }
    render :json => "OK".to_json
  end

  def add
    valid, error = add_metric(params[:domain_entity], params[:metric], params[:increment])
    return render_metric_error(error) unless valid
    render :json => "OK".to_json
  end


  private

  def add_metric(entity, metric, raw_increment)
    # metrics and entities must be simple names, optional hyphens
    if (metric =~ /^[a-z-]+$/ ).nil? || (entity =~ /^[a-z-]+$/ ).nil?
      return [false, "Entity/Metric not properly formed"]
    end

    unless ClientAnalyticsHelper.is_allowed(entity, metric)
      return [false, "Entity/Metric not allowed: #{entity}/#{metric}"]
    end

    # increment must be a positive integer
    increment = ClientAnalyticsHelper.get_valid_increment(entity, metric, raw_increment)
    if increment <= 0
      return [false, "Metric Value Invalid"]
    end

    # Currently we replace 'domain' with the domain id, but presumably
    # it will be desirable someday to have domain-centric entities outside
    # the main one, such as we have with "referers-[domainId]" - We should
    # do a search and replace at that point then.
    if entity == 'domain'
      entity = CurrentDomain.domain.id.to_s
    end

    if entity == 'domain-intern'
      entity = CurrentDomain.domain.id.to_s + "-intern"
    end

    Rails.logger.info("Pushing client-side metric, #{entity}/#{metric} = #{increment}")
    MetricQueue.instance.push_metric(entity, metric, increment)
    [true, nil]
  end

  def render_metric_error(reason)
    render :json => reason.to_json, :status => 400
  end
end

module ClientAnalyticsHelper
  MARK_METRICS = %w(domain/js-page-view domain-intern/js-page-load-samples).freeze
  ALLOWED_METRICS = %w(domain/js-page-view domain-intern/js-page-load-samples domain-intern/js-page-load-time).freeze

  def self.get_valid_increment(entity, metric, input)
    increment = input.to_i
    if increment <= 0
      return 0
    end
    if is_mark(entity, metric)
      increment = 1
    end
    increment
  end

  def self.is_mark(entity, metric)
    MARK_METRICS.include?(entity + '/' + metric)
  end

  def self.is_allowed(entity, metric)
    ALLOWED_METRICS.include?(entity + '/' + metric)
  end

end