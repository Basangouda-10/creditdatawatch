
import sqlite3

def fix_audit_logs_table():
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    
    print("Dropping old audit_logs table...")
    cursor.execute("DROP TABLE IF EXISTS audit_logs")
    
    print("Creating new audit_logs table...")
    # Based on AuditLog model in models/__init__.py
    cursor.execute("""
        CREATE TABLE audit_logs (
            id VARCHAR(36) NOT NULL, 
            user_id VARCHAR(36) NOT NULL, 
            action VARCHAR(100) NOT NULL, 
            entity VARCHAR(100) NOT NULL, 
            entity_id VARCHAR(36), 
            timestamp DATETIME NOT NULL, 
            extra_data JSON, 
            PRIMARY KEY (id)
        )
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX idx_audit_logs_action ON audit_logs (action)")
    cursor.execute("CREATE INDEX idx_audit_logs_entity ON audit_logs (entity)")
    cursor.execute("CREATE INDEX idx_audit_logs_entity_id ON audit_logs (entity_id)")
    cursor.execute("CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp)")
    cursor.execute("CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id)")
    cursor.execute("CREATE INDEX idx_audit_log_action_timestamp ON audit_logs (action, timestamp)")
    cursor.execute("CREATE INDEX idx_audit_log_user_action ON audit_logs (user_id, action)")
    
    conn.commit()
    print("Table audit_logs recreated successfully.")
    conn.close()

if __name__ == "__main__":
    fix_audit_logs_table()
