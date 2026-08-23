from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, ProfileUpdate
from app.services.auth_service import get_password_hash, verify_password, create_access_token
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new resident or admin account."""
    existing_user = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Sanitize role: only allow 'resident' or 'admin'
    role = user_in.role.lower().strip() if user_in.role else UserRole.RESIDENT.value
    if role not in [UserRole.RESIDENT.value, UserRole.ADMIN.value]:
        role = UserRole.RESIDENT.value

    hashed_pw = get_password_hash(user_in.password)
    user = User(
        email=user_in.email.lower().strip(),
        full_name=user_in.full_name.strip(),
        password_hash=hashed_pw,
        role=role,
        flat_number=user_in.flat_number.strip() if user_in.flat_number else None,
        phone_number=user_in.phone_number.strip() if user_in.phone_number else None
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive JWT token."""
    user = db.query(User).filter(User.email == login_data.email.lower().strip()).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update profile details (name, phone, flat number) and/or change password."""
    if profile_in.full_name is not None and profile_in.full_name.strip():
        current_user.full_name = profile_in.full_name.strip()
    if profile_in.phone_number is not None:
        current_user.phone_number = profile_in.phone_number.strip() if profile_in.phone_number.strip() else None
    if profile_in.flat_number is not None:
        current_user.flat_number = profile_in.flat_number.strip() if profile_in.flat_number.strip() else None

    # Change password if requested
    if profile_in.new_password:
        if not profile_in.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to set a new password."
            )
        if not verify_password(profile_in.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect."
            )
        if len(profile_in.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 6 characters long."
            )
        current_user.password_hash = get_password_hash(profile_in.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user
