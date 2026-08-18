from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import Base metadata
from app.database import Base

# Import models to register them
import app.models

# Alembic Config object
config = context.config

# Configure logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in offline mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in online (sync) mode."""
section = config.get_section(config.config_ini_section) or {}
connectable = engine_from_config(
    section,
    prefix="sqlalchemy.",
    poolclass=pool.NullPool,
     )

with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
