from sqlalchemy import Integer, String, bindparam, inspect, text
from sqlalchemy.engine import Engine


def run_migrations(engine: Engine) -> None:
    with engine.begin() as connection:
        connection.execute(text(
            "CREATE TABLE IF NOT EXISTS schema_migrations "
            "(version VARCHAR(64) PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)"
        ))
        applied = connection.execute(
            text("SELECT version FROM schema_migrations WHERE version = :version"),
            {"version": "001_dynamic_categories"},
        ).scalar_one_or_none()
        if applied:
            return

        columns = {
            table: {column["name"] for column in inspect(connection).get_columns(table)}
            for table in ("user_categories", "transactions")
        }
        additions = {
            "user_categories": {
                "category_type": "VARCHAR(20) NOT NULL DEFAULT 'expense'",
                "updated_at": "TIMESTAMP",
            },
            "transactions": {
                "category_id": "INTEGER REFERENCES user_categories(id) ON DELETE SET NULL",
                "category_name_snapshot": "VARCHAR(80)",
                "category_type_snapshot": "VARCHAR(20)",
            },
        }
        for table, table_additions in additions.items():
            for column, definition in table_additions.items():
                if column not in columns[table]:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
        connection.execute(text(
            "UPDATE user_categories SET category_type = 'contribution' "
            "WHERE category_key IN ('savings', 'investment', 'emergency')"
        ))
        connection.execute(text(
            "UPDATE user_categories SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL"
        ))
        if "user_settings" in inspect(connection).get_table_names():
            legacy_categories = (
                ("expense", "expense_name", "expense_percentage", "expense", 0),
                ("savings", "savings_name", "savings_percentage", "contribution", 1),
                ("investment", "investment_name", "investment_percentage", "contribution", 2),
                ("emergency", "emergency_name", "emergency_percentage", "contribution", 3),
            )
            for key, name_column, percentage_column, category_type, order in legacy_categories:
                connection.execute(text(
                    "INSERT INTO user_categories "
                    "(user_id, category_key, name, percentage, is_active, sort_order, category_type, created_at, updated_at) "
                    "SELECT settings.user_id, CAST(:category_key AS VARCHAR(40)), settings." + name_column + ", settings."
                    + percentage_column + ", TRUE, CAST(:sort_order AS INTEGER), "
                    "CAST(:category_type AS VARCHAR(20)), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP "
                    "FROM user_settings AS settings WHERE NOT EXISTS ("
                    "SELECT 1 FROM user_categories WHERE user_categories.user_id = settings.user_id "
                    "AND user_categories.category_key = CAST(:category_key AS VARCHAR(40)))"
                ).bindparams(
                    bindparam("category_key", type_=String(40)),
                    bindparam("sort_order", type_=Integer()),
                    bindparam("category_type", type_=String(20)),
                ), {
                    "category_key": key,
                    "sort_order": order,
                    "category_type": category_type,
                })
        connection.execute(text(
            "UPDATE transactions SET category_id = ("
            "SELECT user_categories.id FROM user_categories "
            "WHERE user_categories.user_id = transactions.user_id "
            "AND user_categories.category_key = transactions.category"
            ") WHERE category_id IS NULL AND category != 'income' "
            "AND EXISTS (SELECT 1 FROM user_categories "
            "WHERE user_categories.user_id = transactions.user_id "
            "AND user_categories.category_key = transactions.category)"
        ))
        indexes = {index["name"] for index in inspect(connection).get_indexes("transactions")}
        if "ix_transactions_category_id" not in indexes:
            connection.execute(text("CREATE INDEX ix_transactions_category_id ON transactions (category_id)"))
        connection.execute(text(
            "INSERT INTO schema_migrations (version) VALUES ('001_dynamic_categories')"
        ))
