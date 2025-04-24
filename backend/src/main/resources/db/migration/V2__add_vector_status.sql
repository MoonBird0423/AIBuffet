ALTER TABLE doc_chunks 
ADD COLUMN vector_status VARCHAR(20) DEFAULT 'PENDING',
ADD COLUMN vector_error TEXT,
ADD COLUMN retry_count INT DEFAULT 0;

-- Add index for better query performance
CREATE INDEX idx_doc_chunks_vector_status ON doc_chunks(vector_status);
