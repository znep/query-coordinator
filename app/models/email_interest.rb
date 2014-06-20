class EmailInterest < Model
  cattr_accessor :specification

  def self.create(user_id, tag, batch_id = nil)
    path = "/users/#{user_id}/#{self.service_name}.json"
    attributes = {eventTag: tag}
    CoreServer::Base.connection.create_request(path, attributes.to_json, {}, false, batch_id)
  end

  def delete(user_id, batch_id = nil)
    path = "/users/#{user_id}/#{self.class.service_name}/#{eventTag}"
    return CoreServer::Base.connection.delete_request(path, '', {}, batch_id)
  end

  @@specification = {
    'MAIL.ACCOUNT_CREATED_FROM_FUTURE_ACCOUNT' => {right: 'manage_users', description: 'privileged_account_created'},
    'MAIL.ANY_VIEW_CREATED' => {description: 'any_view_created'},
    'MAIL.COMMENT_NEEDS_MODERATION' => {right: 'moderate_comments', description: 'comment_to_moderate'},
    'MAIL.FUTURE_ACCOUNT_CREATED' => {right: 'manage_users', description: 'account_provisioned'},
    'MAIL.NEW_NOMINATION' =>   {description: 'nomination_created'},
    'MAIL.NOMINATION_STATUS_CHANGED' => {description: 'nomination_moderated'},
    'MAIL.VIEW_MADE_PUBLIC' => {description: 'view_made_public'},
    'MAIL.VIEW_DELETED' =>  {right: 'view_others_datasets', description: 'view_deleted'},
  }
end
