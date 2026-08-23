import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Society Maintenance Complaint Tracker"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "supersecret_jwt_key_society_tracker_2026_secure_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./complaint.db"
    
    # Uploads
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    MAX_FILE_SIZE_MB: int = 10
    
    # Email notifications (Resend)
    RESEND_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "onboarding@resend.dev"
    EMAIL_ENABLED: bool = False
    
    # Default overdue threshold in days
    DEFAULT_OVERDUE_DAYS: int = 7
    
    # Frontend URL for links and CORS
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
