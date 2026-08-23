from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# For SQLite, check_same_thread needs to be False
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db_schema():
    """Create tables and apply lightweight migrations if necessary."""
    Base.metadata.create_all(bind=engine)
    
    # Check if newly added columns exist in existing SQLite databases
    if settings.DATABASE_URL.startswith("sqlite"):
        try:
            with engine.connect() as conn:
                # 1. complaint_history.action_type
                result = conn.execute(text("PRAGMA table_info(complaint_history)"))
                ch_columns = [row[1] for row in result.fetchall()]
                if ch_columns and "action_type" not in ch_columns:
                    conn.execute(text("ALTER TABLE complaint_history ADD COLUMN action_type VARCHAR(50) DEFAULT 'STATUS_CHANGED'"))
                    conn.execute(text("UPDATE complaint_history SET action_type = 'CREATED' WHERE old_status IS NULL"))
                
                # 2. complaints.assigned_to and assigned_at
                result = conn.execute(text("PRAGMA table_info(complaints)"))
                c_columns = [row[1] for row in result.fetchall()]
                if c_columns and "assigned_to" not in c_columns:
                    conn.execute(text("ALTER TABLE complaints ADD COLUMN assigned_to INTEGER"))
                if c_columns and "assigned_at" not in c_columns:
                    conn.execute(text("ALTER TABLE complaints ADD COLUMN assigned_at DATETIME"))

                # 3. users.specialization and is_active
                result = conn.execute(text("PRAGMA table_info(users)"))
                u_columns = [row[1] for row in result.fetchall()]
                if u_columns and "specialization" not in u_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN specialization VARCHAR(100)"))
                if u_columns and "is_active" not in u_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))

                conn.commit()
        except Exception:
            pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
