CREATE TABLE audit_logs (
    id BIGSERIAL,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(200),
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    request_id UUID,
    CONSTRAINT chk_action_length CHECK (LENGTH(action) >= 1 AND LENGTH(action) <= 100),
    CONSTRAINT chk_resource_length CHECK (resource IS NULL OR LENGTH(resource) <= 200),
    CONSTRAINT pk_audit_logs PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

CREATE TABLE audit_logs_202507 PARTITION OF audit_logs 
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

CREATE TABLE audit_logs_202508 PARTITION OF audit_logs 
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_resource ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_request_id ON audit_logs(request_id);

CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_resource VARCHAR(200) DEFAULT NULL,
    p_resource_id VARCHAR(100) DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id, action, resource, resource_id, 
        old_values, new_values, ip_address, user_agent,
        request_id
    ) VALUES (
        p_user_id, p_action, p_resource, p_resource_id,
        p_old_values, p_new_values, p_ip_address, p_user_agent,
        p_request_id
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION audit_users_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM create_audit_log(
            OLD.id,
            'DELETE',
            'users',
            OLD.id::TEXT,
            row_to_json(OLD)::JSONB,
            NULL
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM create_audit_log(
            NEW.id,
            'UPDATE',
            'users',
            NEW.id::TEXT,
            row_to_json(OLD)::JSONB,
            row_to_json(NEW)::JSONB
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM create_audit_log(
            NEW.id,
            'INSERT',
            'users',
            NEW.id::TEXT,
            NULL,
            row_to_json(NEW)::JSONB
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_users_changes();

CREATE OR REPLACE FUNCTION create_audit_partition(partition_date DATE)
RETURNS void AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    start_date := date_trunc('month', partition_date);
    end_date := start_date + interval '1 month';
    partition_name := 'audit_logs_' || to_char(start_date, 'YYYYMM');
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs 
         FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_audit_partitions(months_to_keep INTEGER DEFAULT 12)
RETURNS void AS $$
DECLARE
    partition_record RECORD;
    cutoff_date DATE;
    partition_date DATE;
BEGIN
    cutoff_date := date_trunc('month', CURRENT_DATE) - (months_to_keep || ' months')::INTERVAL;

    FOR partition_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'audit_logs_%' 
        AND tablename ~ '^audit_logs_[0-9]{6}$'
    LOOP
        BEGIN
            partition_date := to_date(substr(partition_record.tablename, 12), 'YYYYMM');
            IF partition_date < cutoff_date THEN
                EXECUTE format('DROP TABLE IF EXISTS %I', partition_record.tablename);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW v_recent_activity AS
SELECT 
    al.timestamp,
    u.email as user_email,
    u.first_name || ' ' || u.last_name as user_name,
    al.action,
    al.resource,
    al.resource_id,
    al.ip_address
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY al.timestamp DESC
LIMIT 100;

CREATE OR REPLACE VIEW v_user_activity_summary AS
SELECT 
    u.email,
    u.first_name || ' ' || u.last_name as user_name,
    COUNT(*) as total_actions,
    COUNT(DISTINCT DATE(al.timestamp)) as active_days,
    MAX(al.timestamp) as last_activity,
    array_agg(DISTINCT al.action) as actions_performed
FROM users u
JOIN audit_logs al ON u.id = al.user_id
WHERE al.timestamp >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY u.id, u.email, u.first_name, u.last_name
ORDER BY total_actions DESC;

DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@plantanalytics.com' LIMIT 1;
    IF admin_user_id IS NOT NULL THEN
        PERFORM create_audit_log(
            admin_user_id,
            'LOGIN',
            'login',
            gen_random_uuid()::TEXT,
            NULL,
            ('{"login_time": "' || CURRENT_TIMESTAMP || '"}')::JSONB,
            '127.0.0.1',
            'Plant Analytics System Setup'
        );
    END IF;
END
$$;
