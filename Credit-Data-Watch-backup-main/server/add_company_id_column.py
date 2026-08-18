
import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        user='postgres',
        password='2004',
        database='creditdatawatch',
        host='localhost',
        port=5432
    )
    
    try:
        # Add company_id column
        await conn.execute("""
            ALTER TABLE global_credibility_index
            ADD COLUMN IF NOT EXISTS company_id VARCHAR(36) NULL
        """)
        print("Added company_id column")
        
        # Create index
        await conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS ix_global_credibility_index_company_id
            ON global_credibility_index(company_id)
        """)
        print("Created index on company_id")
        
        # Add foreign key
        await conn.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'fk_gci_company_id'
                ) THEN
                    ALTER TABLE global_credibility_index
                    ADD CONSTRAINT fk_gci_company_id
                    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
                END IF;
            END $$;
        """)
        print("Added foreign key constraint")
        
    finally:
        await conn.close()

asyncio.run(main())
