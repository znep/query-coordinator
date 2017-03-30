require 'rails_helper'
require 'rspec/expectations'

RSpec::Matchers.define :a_metric_matching do |entity, name|
  match do |actual|
    actual.detect { |m| m[:entityId] == entity && m[:name] == name }.present?
  end
  description do
    "a metric matching { entityId: #{entity}, name: #{name} }"
  end
end

RSpec.describe StoryAccessLogger do

  describe '#log_story_view_access' do
    let(:story) { FactoryGirl.create(:draft_story) }
    let(:domain_json) { JSON.parse(fixture('domain.json').read) }
    let(:domain_id) { domain_json['id'] }
    let(:referrer_host_metric_name) { 'referrer-http-example.com' }

    before do
      allow(CoreServer).to receive(:current_domain).and_return(domain_json)
    end

    context 'when story is draft' do
      it 'does not queue metrics processing job' do
        expect(ProcessMetricsJob).to_not receive(:perform_later)
        StoryAccessLogger.log_story_view_access(story)
      end
    end

    context 'when story is published' do
      let(:story) { FactoryGirl.create(:published_story) }

      it 'queues metrics processing job' do
        expect(ProcessMetricsJob).to receive(:perform_later)
        StoryAccessLogger.log_story_view_access(story)
      end

      it 'pushes a view-loaded event for story uid' do
        expect(ProcessMetricsJob).to receive(:perform_later).with(a_metric_matching(story.uid, 'view-loaded'))
        StoryAccessLogger.log_story_view_access(story)
      end

      it 'pushes a view-loaded event for current domain' do
        expect(ProcessMetricsJob).to receive(:perform_later).with(a_metric_matching(domain_id, 'view-loaded'))
        StoryAccessLogger.log_story_view_access(story)
      end

      it 'pushes a stories-views-loaded event for current domain' do
        expect(ProcessMetricsJob).to receive(:perform_later).with(a_metric_matching("stories-views-loaded-#{domain_id}", "view-#{story.uid}"))
        StoryAccessLogger.log_story_view_access(story)
      end

      context 'without http_referrer' do
        before do
          allow(::RequestStore.store).to receive(:[]).with(:http_referrer).and_return(nil)
        end

        it 'does not push a referrer event for current domain' do
          expect(ProcessMetricsJob).to receive(:perform_later)
          expect(ProcessMetricsJob).to_not receive(:perform_later).with(a_metric_matching("referrer-hosts-#{domain_id}", referrer_host_metric_name))
          StoryAccessLogger.log_story_view_access(story)
        end

        it 'does not push embedded view metrics when :embedded option is true' do
          expect(ProcessMetricsJob).to receive(:perform_later)
          expect(ProcessMetricsJob).to_not receive(:perform_later).with(a_metric_matching("stories-publishes-hosts-#{domain_id}", referrer_host_metric_name))
          StoryAccessLogger.log_story_view_access(story, embedded: true)
        end
      end

      context 'with http_referrer' do
        let(:referrer_host) { 'http://example.com/blah/blah.html' }

        before do
          allow(::RequestStore.store).to receive(:[]).with(:http_referrer).and_return(referrer_host)
        end

        it 'pushes a stories-referrer event for current domain' do
          expect(ProcessMetricsJob).to receive(:perform_later).with(a_metric_matching("stories-referrer-hosts-#{domain_id}", referrer_host_metric_name))
          StoryAccessLogger.log_story_view_access(story)
        end

        it 'pushes a stories-referrer event for current story 4x4' do
          expect(ProcessMetricsJob).to receive(:perform_later).with(a_metric_matching("stories-referrer-hosts-#{story.uid}", referrer_host_metric_name))
          StoryAccessLogger.log_story_view_access(story)
        end

        it 'pushes a stories-referrer-paths event for current domain' do
          expect(ProcessMetricsJob).to receive(:perform_later).with(a_metric_matching("stories-referrer-paths-#{domain_id}-http-example.com", 'path-/blah/blah.html'))
          StoryAccessLogger.log_story_view_access(story)
        end

        it 'pushes a stories-referrer-paths event for current story 4x4' do
          expect(ProcessMetricsJob).to receive(:perform_later).with(a_metric_matching("stories-referrer-paths-#{story.uid}-http-example.com", 'path-/blah/blah.html'))
          StoryAccessLogger.log_story_view_access(story)
        end

        it 'does not push embedded view metrics by default' do
          expect(ProcessMetricsJob).to receive(:perform_later)
          expect(ProcessMetricsJob).to_not receive(:perform_later).with(a_metric_matching("stories-publishes-hosts-#{domain_id}", referrer_host_metric_name))
          StoryAccessLogger.log_story_view_access(story)
        end

        context 'when additional_param, :embedded, is set to true' do
          it 'pushes stories-publishes-hosts event for current domain' do
            expect(ProcessMetricsJob).to receive(:perform_later).with(a_metric_matching("stories-publishes-hosts-#{domain_id}", referrer_host_metric_name))
            StoryAccessLogger.log_story_view_access(story, embedded: true)
          end

          it 'pushes stories-publishes-hosts event for current story 4x4' do
            expect(ProcessMetricsJob).to receive(:perform_later).with(a_metric_matching("stories-publishes-hosts-#{story.uid}", referrer_host_metric_name))
            StoryAccessLogger.log_story_view_access(story, embedded: true)
          end
        end
      end
    end
  end
end
