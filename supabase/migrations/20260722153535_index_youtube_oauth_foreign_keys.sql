create index if not exists youtube_oauth_states_user_id_idx
  on private.youtube_oauth_states (user_id);

create index if not exists youtube_oauth_states_workspace_id_idx
  on private.youtube_oauth_states (workspace_id);

create index if not exists youtube_oauth_states_brand_id_idx
  on private.youtube_oauth_states (brand_id);

create index if not exists youtube_oauth_attempts_user_id_idx
  on private.youtube_oauth_attempts (user_id);

create index if not exists youtube_oauth_attempts_workspace_id_idx
  on private.youtube_oauth_attempts (workspace_id);

create index if not exists youtube_oauth_attempts_brand_id_idx
  on private.youtube_oauth_attempts (brand_id);
