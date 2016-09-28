require 'rails_helper'

RSpec.describe HealthController, type: :controller do
  before do
    Delayed::Worker.delay_jobs = true
    stub_const('Storyteller::BOOTED_TIMESTAMP', 98765432)

    get :show
  end

  let(:result) { JSON.parse(response.body) }

  describe '#show' do
    let(:job_age) { 1 }

    it 'renders uptime' do
      expect(result['bootedTimestamp']).to eq 98765432
    end

    it 'renders delayedJobQueues' do
      expected = {
        'documents'=>{'maxAge'=>30, 'count'=>0},
        'domains'=>{'maxAge'=>300, 'count'=>0},
        'metrics'=>{'maxAge'=>60, 'count'=>0},
        'thumbnails'=>{'maxAge'=>60, 'count'=>0}
      }
      expect(result['delayedJobQueues']).to eq(expected)
    end

    context 'when documents queue has items' do
      before do
        ProcessDocumentJob.perform_later(1)
        Delayed::Job.last.update_column(:created_at, job_age.seconds.ago)
        get :show
      end

      context 'when job age is less than 30 seconds' do
        let(:job_age) { 29 }

        it 'does not include new document job in count' do
          expect(result['delayedJobQueues']['documents']['count']).to eq(0)
        end
      end

      context 'when job age is more than 30 seconds' do
        let(:job_age) { 31 }

        it 'includes older document jobs in count' do
          expect(result['delayedJobQueues']['documents']['count']).to eq(1)
        end
      end
    end

    context 'when thumbnails queue has items' do
      before do
        RegenerateSkippedThumbnailsJob.perform_later(1)
        Delayed::Job.last.update_column(:created_at, job_age.seconds.ago)
        get :show
      end

      context 'when job age is less than 60 seconds' do
        let(:job_age) { 59 }

        it 'does not include new thumbnails job in count' do
          expect(result['delayedJobQueues']['thumbnails']['count']).to eq(0)
        end
      end

      context 'when job age is more than 60 seconds' do
        let(:job_age) { 61 }

        it 'includes older thumbnails jobs in count' do
          expect(result['delayedJobQueues']['thumbnails']['count']).to eq(1)
        end
      end
    end

    context 'when metrics queue has items' do
      before do
        ProcessMetricsJob.perform_later({})
        Delayed::Job.last.update_column(:created_at, job_age.seconds.ago)
        get :show
      end

      context 'when job age is less than 60 seconds' do
        let(:job_age) { 59 }

        it 'does not include new metrics job in count' do
          expect(result['delayedJobQueues']['metrics']['count']).to eq(0)
        end
      end

      context 'when job age is more than 60 seconds' do
        let(:job_age) { 61 }

        it 'includes older metrics jobs in count' do
          expect(result['delayedJobQueues']['metrics']['count']).to eq(1)
        end
      end
    end

    context 'when domains queue has items' do
      before do
        UpdateDomainsJob.perform_later('old_domain', 'new_domain')
        Delayed::Job.last.update_column(:created_at, job_age.seconds.ago)
        get :show
      end

      context 'when job age is less than 300 seconds' do
        let(:job_age) { 299 }

        it 'does not include new domains job in count' do
          expect(result['delayedJobQueues']['domains']['count']).to eq(0)
        end
      end

      context 'when job age is more than 60 seconds' do
        let(:job_age) { 301 }

        it 'includes older domains jobs in count' do
          expect(result['delayedJobQueues']['domains']['count']).to eq(1)
        end
      end
    end

  end
end
