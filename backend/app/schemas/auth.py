from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    flat_number: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[str] = "resident"
    specialization: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    flat_number: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None

class StaffCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    phone_number: Optional[str] = None
    specialization: str  # Plumbing, Electrical, Cleaning, Security, General Maintenance

class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    specialization: Optional[str] = None
    is_active: Optional[bool] = None
