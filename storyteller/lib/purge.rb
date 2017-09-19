# Purges blocks and draft stories that are sufficiently old.
# The current design of Storyteller makes old drafts unreachable via API or UI.
module Purge
  class << self

    def run
      start_time = Time.current

      items_to_purge = old_drafts_with_blocks

      fetch_time = Time.current - start_time
      Rails.logger.info("[Purge] Fetched purge candidates in #{fetch_time} seconds")

      if items_to_purge.empty?
        Rails.logger.info('[Purge] Nothing to purge')
        return
      end

      drafts_to_purge = items_to_purge.map { |record| record[:id] }
      blocks_to_purge = items_to_purge.map { |record| record[:block_ids] }.flatten

      Rails.logger.warn("[Purge] Deleting #{blocks_to_purge.size} blocks")
      Block.where('id IN (:ids)', ids: blocks_to_purge).update_all(deleted_at: start_time)

      Rails.logger.warn("[Purge] Deleting #{drafts_to_purge.size} drafts")
      DraftStory.where('id IN (:ids)', ids: drafts_to_purge).update_all(deleted_at: start_time)

      job_time = Time.current - start_time
      Rails.logger.info("[Purge] Purge completed in #{job_time} seconds")
    end

    private

    # The definition of an "old" draft is two-fold:
    #   1) created prior to the second most-recent published version
    #   2) created more than three months ago
    # A draft must meet both criteria to be selected by this query; in other
    # words, story drafts with only one published version, no published version,
    # or only recent drafts are excluded.
    def old_drafts_with_blocks
      query = <<~SQL
        SELECT ds.id, ds.block_ids
        FROM draft_stories ds
          INNER JOIN (
            SELECT uid, MAX(created_at) as cutoff
            FROM (
              SELECT uid, created_at, (DENSE_RANK() OVER (PARTITION BY uid ORDER BY created_at DESC)) AS rank
              FROM published_stories
              WHERE deleted_at IS NULL
            ) publication_history
            WHERE rank >= 2
            GROUP BY uid
          ) cutoffs ON cutoffs.uid = ds.uid
        WHERE ds.deleted_at IS NULL
          AND ds.created_at < (CURRENT_TIMESTAMP - INTERVAL '3 MONTHS') AT TIME ZONE 'UTC'
          AND ds.created_at < cutoffs.cutoff
      SQL

      # Transforms "{11,22,33}" into [11,22,33], because the query retrieves
      # block_ids as a string instead of an array.
      block_id_cleaner = %r([{}])
      block_id_splitter = -> ids { ids.gsub(block_id_cleaner, '').split(',').map(&:to_i) }

      ActiveRecord::Base.connection.exec_query(query).map do |record|
        {
          id: record['id'].to_i,
          block_ids: block_id_splitter.(record['block_ids'] || '')
        }
      end
    end

  end
end
