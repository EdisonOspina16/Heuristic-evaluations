import pytest
from fastapi import HTTPException

from src.infrastructure.models import Permission, User
from src.interfaces.api.users import list_all_permissions, update_user_permissions

from user_management_helpers import FakeQuery, FakeSession, expect, permission, role, user


def test_list_all_permissions_returns_every_permission():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    permissions = [permission("MANAGE_USERS"), permission("ASSIGN_ROLES")]
    db = FakeSession({Permission: [FakeQuery(all=permissions)]})

    # Act
    result = list_all_permissions(db=db, current_user=admin)

    # Assert
    expect(result).should_equal(permissions)
    expect(result[0].code).should_equal("MANAGE_USERS")


def test_update_user_permissions_returns_404_when_user_does_not_exist():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    db = FakeSession({User: [FakeQuery(first=None)]})

    # Act
    with pytest.raises(HTTPException) as exc:
        update_user_permissions(99, ["MANAGE_USERS"], db=db, current_user=admin)

    # Assert
    expect(exc.value.status_code).should_equal(404)
    expect(exc.value.detail).should_equal("User not found")
    expect(db.commits).should_equal(0)


def test_update_user_permissions_replaces_direct_permissions_with_matching_codes():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, direct_permissions=[permission("OLD_PERMISSION")])
    new_permissions = [permission("MANAGE_USERS"), permission("DELETE_USERS")]
    db = FakeSession({
        User: [FakeQuery(first=target)],
        Permission: [FakeQuery(all=new_permissions)],
    })

    # Act
    result = update_user_permissions(2, ["MANAGE_USERS", "DELETE_USERS"], db=db, current_user=admin)

    # Assert
    expect(result["message"]).should_equal("Permissions updated successfully")
    expect(target.direct_permissions).should_equal(new_permissions)
    expect(db.commits).should_equal(1)


def test_update_user_permissions_can_clear_all_direct_permissions():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, direct_permissions=[permission("MANAGE_USERS")])
    db = FakeSession({
        User: [FakeQuery(first=target)],
        Permission: [FakeQuery(all=[])],
    })

    # Act
    result = update_user_permissions(2, [], db=db, current_user=admin)

    # Assert
    expect(result["message"]).should_equal("Permissions updated successfully")
    expect(target.direct_permissions).should_equal([])
    expect(db.commits).should_equal(1)
