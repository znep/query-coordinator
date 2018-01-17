/* eslint-disable camelcase */
// snake_casing these constants to try to remain consistent with core


// NOTE:
// This is a list of VIEW rights granted to users
// This needs to reflect:
//  - ALL_RIGHTS in frontend/lib/view_rights.rb
//  - Right enum in core at unobtainium/src/main/java/com/blist/models/views/Permission.java

// namespaced these constants with view_rights_ to avoid having a 'delete' since it is reserved in JS

export const view_rights_add = 'add';
export const view_rights_add_column = 'add_column';
export const view_rights_delete = 'delete';
export const view_rights_delete_view = 'delete_view';
export const view_rights_grant = 'grant';
export const view_rights_read = 'read';
export const view_rights_remove_column = 'remove_column';
export const view_rights_update_column = 'update_column';
export const view_rights_update_view = 'update_view';
export const view_rights_write = 'write';

export const mutation_rights = [
  view_rights_add,
  view_rights_delete,
  view_rights_update_view,
  view_rights_write
];
