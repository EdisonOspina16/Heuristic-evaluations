
from src.infrastructure.database import SessionLocal
from src.infrastructure.models import User, Role, Permission

db = SessionLocal()
try:
    users = db.query(User).all()
    print("USERS AND ROLES:")
    for u in users:
        roles = [r.name for r in u.roles]
        perms = [p.code for p in u.direct_permissions]
        print(f"User: {u.nombre} ({u.email}), Roles: {roles}, Direct Perms: {perms}")
        
    print("\nROLES AND PERMISSIONS:")
    roles = db.query(Role).all()
    for r in roles:
        perms = [p.code for p in r.permissions]
        print(f"Role: {r.name}, Perms: {perms}")
finally:
    db.close()
