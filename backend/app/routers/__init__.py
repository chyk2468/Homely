from app.routers.auth import router as auth_router
from app.routers.complaints import router as complaints_router
from app.routers.notices import router as notices_router
from app.routers.dashboard import router as dashboard_router
from app.routers.settings import router as settings_router
from app.routers.admin import router as admin_router
from app.routers.staff import router as staff_router
from app.routers.notifications import router as notifications_router

__all__ = [
    "auth_router",
    "complaints_router",
    "notices_router",
    "dashboard_router",
    "settings_router",
    "admin_router",
    "staff_router",
    "notifications_router",
]
