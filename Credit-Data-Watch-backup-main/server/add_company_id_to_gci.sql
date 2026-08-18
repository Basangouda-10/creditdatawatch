
-- Add company_id column to global_credibility_index table
ALTER TABLE global_credibility_index
ADD COLUMN company_id VARCHAR(36) NULL;

-- Create an index on company_id
CREATE UNIQUE INDEX ix_global_credibility_index_company_id
ON global_credibility_index(company_id);

-- Add foreign key constraint
ALTER TABLE global_credibility_index
ADD CONSTRAINT fk_gci_company_id
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
