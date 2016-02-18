require 'rails_helper'

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
        expect(ProcessMetricsJob).to receive(:perform_later) do |args|
          expect(
            args.detect {|m| m[:entityId] == story.uid && m[:name] == 'view-loaded' }
          ).to be_present
        end
        StoryAccessLogger.log_story_view_access(story)
      end

      it 'pushes a view-loaded event for current domain' do
        expect(ProcessMetricsJob).to receive(:perform_later) do |args|
          expect(
            args.detect {|m| m[:entityId] == domain_id && m[:name] == 'view-loaded' }
          ).to be_present
        end
        StoryAccessLogger.log_story_view_access(story)
      end

      it 'pushes a views-4x4 event for current domain' do
        expect(ProcessMetricsJob).to receive(:perform_later) do |args|
          expect(
            args.detect {|m| m[:entityId] == "views-loaded-#{domain_id}" && m[:name] == "view-#{story.uid}" }
          ).to be_present
        end
        StoryAccessLogger.log_story_view_access(story)
      end

      it 'pushes a published-story-loaded event for current domain' do
        expect(ProcessMetricsJob).to receive(:perform_later) do |args|
          expect(
            args.detect {|m| m[:entityId] == domain_id && m[:name] == 'published-story-loaded' }
          ).to be_present
        end
        StoryAccessLogger.log_story_view_access(story)
      end

      context 'without http_referrer' do
        before do
          allow(::RequestStore.store).to receive(:[]).with(:http_referrer).and_return(nil)
        end

        it 'does not push a referrer event for current domain' do
          expect(ProcessMetricsJob).to receive(:perform_later) do |args|
            expect(
              args.detect {|m| m[:entityId] == "referrer-hosts-#{domain_id}" && m[:name] == referrer_host_metric_name }
            ).to_not be_present
          end
          StoryAccessLogger.log_story_view_access(story)
        end
      end

      context 'with http_referrer' do
        let(:referrer_host) { 'http://example.com/blah/blah.html' }

        before do
          allow(::RequestStore.store).to receive(:[]).with(:http_referrer).and_return(referrer_host)
        end

        it 'pushes a referrer event for current domain' do
          expect(ProcessMetricsJob).to receive(:perform_later) do |args|
            expect(
              args.detect {|m| m[:entityId] == "referrer-hosts-#{domain_id}" && m[:name] == referrer_host_metric_name }
            ).to be_present
          end
          StoryAccessLogger.log_story_view_access(story)
        end

        it 'pushes a referrer event for current story 4x4' do
          expect(ProcessMetricsJob).to receive(:perform_later) do |args|
            expect(
              args.detect {|m| m[:entityId] == "referrer-hosts-#{story.uid}" && m[:name] == referrer_host_metric_name }
            ).to be_present
          end
          StoryAccessLogger.log_story_view_access(story)
        end

        it 'pushes a referrer-paths event for current domain' do
          expect(ProcessMetricsJob).to receive(:perform_later) do |args|
            expect(
              args.detect {|m| m[:entityId] == "referrer-paths-#{domain_id}-http-example.com" && m[:name] == 'path-/blah/blah.html' }
            ).to be_present
          end
          StoryAccessLogger.log_story_view_access(story)
        end

        it 'pushes a referrer-paths event for current story 4x4' do
          expect(ProcessMetricsJob).to receive(:perform_later) do |args|
            expect(
              args.detect {|m| m[:entityId] == "referrer-paths-#{story.uid}-http-example.com" && m[:name] == 'path-/blah/blah.html' }
            ).to be_present
          end
          StoryAccessLogger.log_story_view_access(story)
        end
      end
    end
  end
end
