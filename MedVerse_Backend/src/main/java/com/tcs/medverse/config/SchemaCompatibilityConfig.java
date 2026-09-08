package com.tcs.medverse.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

@Configuration
@Profile("!api-test")
@ConditionalOnProperty(name = "medverse.schema-compat.enabled", havingValue = "true", matchIfMissing = true)
public class SchemaCompatibilityConfig {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    CommandLineRunner widenLegacyIdColumns(JdbcTemplate jdbcTemplate) {
        return args -> {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.doctor ALTER COLUMN doctor_id TYPE varchar(8)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.patient ALTER COLUMN patient_id TYPE varchar(8)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.access_notification ALTER COLUMN patient_id TYPE varchar(8)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.access_notification ALTER COLUMN doctor_id TYPE varchar(8)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.patient_medical_profile ALTER COLUMN patient_id TYPE varchar(8)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.patient_medical_profile ALTER COLUMN last_updated_by_doctor_id TYPE varchar(8)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.medical_profile_update ALTER COLUMN patient_id TYPE varchar(8)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.medical_profile_update ALTER COLUMN doctor_id TYPE varchar(8)");
            ensureSignupEmailRoleConstraint(jdbcTemplate);
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.doctor ADD COLUMN IF NOT EXISTS profile_image text");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.doctor ALTER COLUMN profile_image TYPE text");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.patient ADD COLUMN IF NOT EXISTS profile_image text");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.patient ALTER COLUMN profile_image TYPE text");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.patient ADD COLUMN IF NOT EXISTS height double precision");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.patient ADD COLUMN IF NOT EXISTS weight double precision");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.patient ADD COLUMN IF NOT EXISTS profile_updated_at timestamp");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.learner ADD COLUMN IF NOT EXISTS department varchar(150)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.learner ADD COLUMN IF NOT EXISTS profile_image text");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.learner ALTER COLUMN department TYPE varchar(150)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.learner ALTER COLUMN profile_image TYPE text");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.authentication_officer ADD COLUMN IF NOT EXISTS profile_image text");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.authentication_officer ALTER COLUMN profile_image TYPE text");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.profile_manage ADD COLUMN IF NOT EXISTS rejection_count integer NOT NULL DEFAULT 0");
            ensureTextColumn(jdbcTemplate, "profile_manage", "document_data");
            ensureTextColumn(jdbcTemplate, "submit_new_case", "case_doc");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.submit_new_case ADD COLUMN IF NOT EXISTS case_doc_name varchar(255)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.submit_new_case ADD COLUMN IF NOT EXISTS case_doc_content_type varchar(100)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.submit_new_case ADD COLUMN IF NOT EXISTS assigned_officer_id varchar(50)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.submit_new_case ADD COLUMN IF NOT EXISTS assigned_officer_name varchar(150)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.submit_new_case ADD COLUMN IF NOT EXISTS assigned_officer_department varchar(150)");
            ensureTextColumn(jdbcTemplate, "published_case", "case_doc");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.published_case ADD COLUMN IF NOT EXISTS case_doc_name varchar(255)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.published_case ADD COLUMN IF NOT EXISTS case_doc_content_type varchar(100)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.published_case ADD COLUMN IF NOT EXISTS verification_id varchar(120)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.published_case ADD COLUMN IF NOT EXISTS auth_officer_remarks text");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS prod.published_case ALTER COLUMN auth_officer_remarks TYPE text");
        };
    }

    private static void ensureSignupEmailRoleConstraint(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.execute(
                """
                DO $$
                DECLARE
                    constraint_name text;
                BEGIN
                    FOR constraint_name IN
                        SELECT con.conname
                        FROM pg_constraint con
                        JOIN pg_class rel ON rel.oid = con.conrelid
                        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                        WHERE nsp.nspname = 'prod'
                          AND rel.relname = 'signup'
                          AND con.contype = 'u'
                          AND (
                              SELECT array_agg(att.attname::text ORDER BY att.attnum)
                              FROM unnest(con.conkey) AS key(attnum)
                              JOIN pg_attribute att
                                ON att.attrelid = con.conrelid
                               AND att.attnum = key.attnum
                          ) = ARRAY['email']
                    LOOP
                        EXECUTE format('ALTER TABLE prod.signup DROP CONSTRAINT IF EXISTS %I', constraint_name);
                    END LOOP;
                END $$;
                """
        );
        jdbcTemplate.execute(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = 'prod'
                          AND table_name = 'signup'
                    ) AND NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint con
                        JOIN pg_class rel ON rel.oid = con.conrelid
                        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                        WHERE nsp.nspname = 'prod'
                          AND rel.relname = 'signup'
                          AND con.conname = 'signup_email_role_uk'
                    ) THEN
                        ALTER TABLE prod.signup ADD CONSTRAINT signup_email_role_uk UNIQUE (email, role);
                    END IF;
                END $$;
                """
        );
    }

    private static void ensureTextColumn(JdbcTemplate jdbcTemplate, String table, String column) {
        List<String> dataTypes = jdbcTemplate.query(
                """
                SELECT data_type
                FROM information_schema.columns
                WHERE table_schema = 'prod'
                  AND table_name = ?
                  AND column_name = ?
                """,
                (rs, rowNum) -> rs.getString("data_type"),
                table,
                column
        );
        if (dataTypes.isEmpty()) {
            return;
        }

        String dataType = dataTypes.get(0);

        if ("bytea".equalsIgnoreCase(dataType)) {
            jdbcTemplate.execute("ALTER TABLE prod." + table + " ALTER COLUMN " + column + " TYPE text USING encode(" + column + ", 'base64')");
            return;
        }

        if ("oid".equalsIgnoreCase(dataType)) {
            jdbcTemplate.execute("ALTER TABLE prod." + table + " ALTER COLUMN " + column + " TYPE text USING encode(lo_get(" + column + "), 'base64')");
            return;
        }

        if (dataType != null && !"text".equalsIgnoreCase(dataType)) {
            jdbcTemplate.execute("ALTER TABLE prod." + table + " ALTER COLUMN " + column + " TYPE text USING " + column + "::text");
        }
    }
}
