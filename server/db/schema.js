/**
 * Ordered schema migrations. Each one runs once, inside a transaction, and is
 * recorded in `schema_migrations`. Never edit an applied migration: append a
 * new one instead.
 */
export const migrations = [
    {
        id: "0001_init",
        sql: /* sql */ `
CREATE TABLE users (
    id                      text PRIMARY KEY,
    provider                text NOT NULL,
    email                   text NOT NULL,
    name                    text NOT NULL,
    is_admin                boolean NOT NULL DEFAULT false,
    is_strip_feature_enable boolean NOT NULL DEFAULT true,
    free_nesting_used       integer NOT NULL DEFAULT 0,
    nesting_count           integer NOT NULL DEFAULT 0,
    stripe_customer_id      text,
    created_at              timestamptz NOT NULL DEFAULT now(),
    last_active_at          timestamptz
);

CREATE TABLE sessions (
    session_id text PRIMARY KEY,
    user_id    text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);

-- The user's Stripe subscription, as last read from Stripe.
CREATE TABLE user_subscriptions (
    user_id                text PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    stripe_subscription_id text NOT NULL,
    status                 text NOT NULL,
    current_period_end     timestamptz,
    price_id               text,
    product_id             text,
    updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_subscriptions_updated_at_idx ON user_subscriptions (updated_at);

-- Every binary blob (uploaded DXF, generated SVG/DXF, avatars). Replaces the
-- GridFS buckets: one table, the bucket is a column.
CREATE TABLE files (
    id         bigserial PRIMARY KEY,
    bucket     text NOT NULL,
    name       text NOT NULL,
    owner_id   text REFERENCES users (id) ON DELETE CASCADE,
    data       bytea NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (bucket, name)
);
CREATE INDEX files_owner_id_idx ON files (owner_id);

CREATE TABLE projects (
    slug       text PRIMARY KEY,
    name       text NOT NULL,
    owner_id   text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_owner_id_idx ON projects (owner_id, created_at DESC);

CREATE TABLE user_dxf_files (
    id                 bigserial PRIMARY KEY,
    slug               text NOT NULL UNIQUE,
    name               text NOT NULL,
    project_slug       text NOT NULL REFERENCES projects (slug) ON DELETE CASCADE,
    owner_id           text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    processing_status  text NOT NULL DEFAULT 'pending',
    processing_error   text,
    worker_tag         text NOT NULL DEFAULT 'normal',
    flattening         double precision NOT NULL DEFAULT 0.01,
    is_dxf_copy_exist  boolean NOT NULL DEFAULT false,
    svg_file_slug      text,
    polygon_parts      jsonb,
    valid_entity_count integer,
    processing_time    double precision NOT NULL DEFAULT 0,
    upload_at          timestamptz NOT NULL DEFAULT now(),
    update_ts          timestamptz
);
CREATE INDEX user_dxf_files_project_slug_idx ON user_dxf_files (project_slug, upload_at);
CREATE INDEX user_dxf_files_queue_idx ON user_dxf_files (worker_tag, id) WHERE processing_status = 'pending';

CREATE TABLE nesting_jobs (
    id              bigserial PRIMARY KEY,
    slug            text NOT NULL UNIQUE,
    project_slug    text NOT NULL REFERENCES projects (slug) ON DELETE CASCADE,
    owner_id        text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    files           jsonb NOT NULL,
    params          jsonb NOT NULL,
    status          text NOT NULL DEFAULT 'pending',
    error           text,
    information     text,
    requested       integer,
    placed          integer,
    layout_count    integer,
    dxf_files       text[] NOT NULL DEFAULT '{}',
    svg_files       text[] NOT NULL DEFAULT '{}',
    billing_status  text,
    billing_attempt integer NOT NULL DEFAULT 0,
    billed_at       timestamptz,
    email_notify    text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    start_at        timestamptz,
    finished_at     timestamptz,
    update_ts       timestamptz,
    time_taken      integer
);
CREATE INDEX nesting_jobs_owner_id_idx ON nesting_jobs (owner_id, created_at DESC);
CREATE INDEX nesting_jobs_project_slug_idx ON nesting_jobs (project_slug);
CREATE INDEX nesting_jobs_queue_idx ON nesting_jobs (id) WHERE status = 'pending';
CREATE INDEX nesting_jobs_billing_idx ON nesting_jobs (billing_status);

CREATE TABLE strip_projects (
    slug       text PRIMARY KEY,
    name       text NOT NULL,
    owner_id   text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX strip_projects_owner_id_idx ON strip_projects (owner_id, created_at DESC);

CREATE TABLE strip_user_dxf_files (
    id                bigserial PRIMARY KEY,
    slug              text NOT NULL UNIQUE,
    name              text NOT NULL,
    strip_slug        text NOT NULL REFERENCES strip_projects (slug) ON DELETE CASCADE,
    owner_id          text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    processing_status text NOT NULL DEFAULT 'pending',
    processing_error  text,
    worker_tag        text NOT NULL DEFAULT 'strip',
    flattening        double precision NOT NULL DEFAULT 0.01,
    polygon_parts     jsonb,
    processing_time   double precision NOT NULL DEFAULT 0,
    upload_at         timestamptz NOT NULL DEFAULT now(),
    update_ts         timestamptz
);
CREATE INDEX strip_user_dxf_files_strip_slug_idx ON strip_user_dxf_files (strip_slug, upload_at);
CREATE INDEX strip_user_dxf_files_queue_idx ON strip_user_dxf_files (id) WHERE processing_status = 'pending';

CREATE TABLE strip_nesting_jobs (
    id              bigserial PRIMARY KEY,
    slug            text NOT NULL UNIQUE,
    strip_slug      text NOT NULL REFERENCES strip_projects (slug) ON DELETE CASCADE,
    owner_id        text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    files           jsonb NOT NULL,
    params          jsonb NOT NULL,
    status          text NOT NULL DEFAULT 'pending',
    error           text,
    requested       integer,
    placed          integer,
    width           double precision,
    density         double precision,
    dxf_files       text[] NOT NULL DEFAULT '{}',
    billing_status  text,
    billing_attempt integer NOT NULL DEFAULT 0,
    billed_at       timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    start_at        timestamptz,
    finished_at     timestamptz,
    update_ts       timestamptz,
    time_taken      integer
);
CREATE INDEX strip_nesting_jobs_owner_id_idx ON strip_nesting_jobs (owner_id, created_at DESC);
CREATE INDEX strip_nesting_jobs_strip_slug_idx ON strip_nesting_jobs (strip_slug, created_at DESC);
CREATE INDEX strip_nesting_jobs_queue_idx ON strip_nesting_jobs (id) WHERE status = 'pending';
CREATE INDEX strip_nesting_jobs_billing_idx ON strip_nesting_jobs (billing_status);

CREATE TABLE support_messages (
    id         bigserial PRIMARY KEY,
    user_id    text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    sender     text NOT NULL,
    message    text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX support_messages_user_id_idx ON support_messages (user_id, id);

-- The on-demand (metered) plan synced from Stripe. A single row, id 'subscription'.
CREATE TABLE subscription_plan (
    id                  text PRIMARY KEY,
    product_id          text NOT NULL,
    price_id            text NOT NULL,
    meter_event_name    text,
    title               text,
    description         text,
    interval            text,
    currency            text,
    unit_amount_decimal text,
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscription_checkouts (
    id          bigserial PRIMARY KEY,
    internal_id text NOT NULL UNIQUE,
    user_id     text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    checkout_id text NOT NULL,
    status      text NOT NULL,
    attempt     integer NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscription_checkouts_status_idx ON subscription_checkouts (status, created_at);

CREATE TABLE tracking (
    id          bigserial PRIMARY KEY,
    action      text NOT NULL,
    country     text,
    data        jsonb,
    session_key text,
    user_id     text,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tracking_session_key_idx ON tracking (session_key) WHERE user_id IS NULL;

CREATE TABLE http_logs (
    id            bigserial PRIMARY KEY,
    method        text,
    url           text,
    is_sse        boolean,
    user_agent    text,
    user_id       text,
    request_body  jsonb,
    status_code   integer,
    duration      integer,
    response_body jsonb,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- Cross-instance locks for periodic jobs (e.g. the daily cleanup).
CREATE TABLE job_locks (
    name        text PRIMARY KEY,
    last_run_at timestamptz NOT NULL
);
`,
    },
];
