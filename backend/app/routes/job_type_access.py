from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session, aliased

from app.auth import get_current_admin
from app.database import get_db
from app.models.employee import UserAccount
from app.models.settings import SystemSetting
from app.models.user_job_type_access import UserJobTypeAccess

router = APIRouter(prefix="/job-type-access", tags=["job-type-access"])


class UserOption(BaseModel):
    user_id: int
    username: str
    display_name: str


class JobTypeOption(BaseModel):
    setting_id: int
    setting_key: str
    label: str


class UserAccessPayload(BaseModel):
    job_type_setting_ids: List[int]


class AccessListRow(BaseModel):
    access_id: int
    user_name: str
    job_type: str
    created_by: str | None = None
    created_on: str
    created_ws: str | None = None


@router.get("/users", response_model=List[UserOption])
def list_users(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    rows = (
        db.query(UserAccount)
        .order_by(UserAccount.username.asc())
        .all()
    )
    out = []
    for row in rows:
        display = row.username
        if row.employee_id:
            display = f"{row.username} - Employee #{row.employee_id}"
        elif row.customer_id:
            display = f"{row.username} - Customer #{row.customer_id}"
        out.append(UserOption(user_id=row.user_id, username=row.username, display_name=display))
    return out


@router.get("/job-types", response_model=List[JobTypeOption])
def list_job_types(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    rows = (
        db.query(SystemSetting)
        .filter(SystemSetting.category == "job_type")
        .order_by(SystemSetting.setting_key.asc())
        .all()
    )
    return [
        JobTypeOption(
            setting_id=row.setting_id,
            setting_key=row.setting_key,
            label=(row.setting_value or row.setting_key),
        )
        for row in rows
    ]


@router.get("/users/{user_id}", response_model=List[int])
def get_user_job_type_access(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    exists = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not exists:
        raise HTTPException(status_code=404, detail="User not found")
    rows = (
        db.query(UserJobTypeAccess.job_type_setting_id)
        .filter(UserJobTypeAccess.user_id == user_id)
        .all()
    )
    return [int(r.job_type_setting_id) for r in rows]


@router.put("/users/{user_id}")
def set_user_job_type_access(
    user_id: int,
    payload: UserAccessPayload,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    valid_job_type_ids = {
        int(r.setting_id)
        for r in db.query(SystemSetting.setting_id)
        .filter(SystemSetting.category == "job_type")
        .all()
    }
    requested = list(dict.fromkeys([int(x) for x in payload.job_type_setting_ids]))
    invalid = [x for x in requested if x not in valid_job_type_ids]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid job_type_setting_ids: {invalid}")

    db.query(UserJobTypeAccess).filter(UserJobTypeAccess.user_id == user_id).delete(synchronize_session=False)
    for setting_id in requested:
        db.add(
            UserJobTypeAccess(
                user_id=user_id,
                job_type_setting_id=setting_id,
                created_by_user_id=getattr(current_user, "user_id", None),
                created_ws=request.headers.get("host"),
            )
        )
    db.commit()
    return {"detail": "Saved", "count": len(requested)}


@router.get("/list", response_model=List[AccessListRow])
def list_all_user_job_type_access(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    creator = aliased(UserAccount)
    rows = (
        db.query(
            UserJobTypeAccess,
            UserAccount.username.label("user_name"),
            SystemSetting.setting_key.label("job_type_key"),
            SystemSetting.setting_value.label("job_type_value"),
            creator.username.label("created_by_name"),
        )
        .join(UserAccount, UserAccount.user_id == UserJobTypeAccess.user_id)
        .join(SystemSetting, SystemSetting.setting_id == UserJobTypeAccess.job_type_setting_id)
        .outerjoin(creator, creator.user_id == UserJobTypeAccess.created_by_user_id)
        .order_by(UserJobTypeAccess.created_at.desc(), UserJobTypeAccess.access_id.desc())
        .all()
    )
    out: List[AccessListRow] = []
    for access, user_name, job_type_key, job_type_value, created_by_name in rows:
        out.append(
            AccessListRow(
                access_id=access.access_id,
                user_name=user_name,
                job_type=f"{(job_type_value or '').strip() or job_type_key} - {job_type_key}",
                created_by=created_by_name,
                created_on=access.created_at.strftime("%Y-%m-%d %H:%M:%S") if access.created_at else "",
                created_ws=access.created_ws,
            )
        )
    return out

