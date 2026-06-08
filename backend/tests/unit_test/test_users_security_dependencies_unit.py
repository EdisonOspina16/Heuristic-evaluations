import pytest
import jwt
from fastapi import HTTPException
from hamcrest import assert_that, equal_to

from src.application.services import security as security_module
from src.application.services.security import ALGORITHM, SECRET_KEY, check_permissions, get_current_user
from src.infrastructure.models import Role, User

from user_management_helpers import FakeQuery, FakeSession, expect, permission, role, user


def test_check_permissions_allows_admin_without_explicit_permission():
    # Arrange
    current_user = user(1, roles=[role("ADMIN")])
    dependency = check_permissions("DELETE_USERS")

    # Act
    result = dependency(current_user=current_user)

    # Assert
    expect(result).should_be(current_user)


def test_check_permissions_allows_permission_from_role():
    # Arrange
    current_user = user(2, roles=[role("EVALUADOR", ["MANAGE_USERS"])])
    dependency = check_permissions("MANAGE_USERS")

    # Act
    result = dependency(current_user=current_user)

    # Assert
    expect(result).should_be(current_user)


def test_check_permissions_allows_direct_permission():
    # Arrange
    current_user = user(3, roles=[role("EVALUADOR")], direct_permissions=[permission("ASSIGN_ROLES")])
    dependency = check_permissions("ASSIGN_ROLES")

    # Act
    result = dependency(current_user=current_user)

    # Assert
    expect(result).should_be(current_user)


def test_check_permissions_blocks_user_without_required_permission():
    # Arrange
    current_user = user(4, roles=[role("EVALUADOR")])
    dependency = check_permissions("DELETE_USERS")

    # Act
    with pytest.raises(HTTPException) as exc:
        dependency(current_user=current_user)

    # Assert
    expect(exc.value.status_code).should_equal(403)
    expect(exc.value.detail).should_equal("Not enough permissions. Required: DELETE_USERS")


def test_get_current_user_rejects_token_without_subject():
    # Arrange
    token = jwt.encode({"id": 1}, SECRET_KEY, algorithm=ALGORITHM)
    db = FakeSession({})

    # Act
    with pytest.raises(HTTPException) as exc:
        get_current_user(token=token, db=db)

    # Assert
    expect(exc.value.status_code).should_equal(401)
    expect(exc.value.detail).should_equal("Could not validate credentials")


def test_get_current_user_rejects_when_subject_user_does_not_exist():
    # Arrange
    token = jwt.encode({"sub": "missing@example.com"}, SECRET_KEY, algorithm=ALGORITHM)
    db = FakeSession({User: [FakeQuery(first=None)]})

    # Act
    with pytest.raises(HTTPException) as exc:
        get_current_user(token=token, db=db)

    # Assert
    expect(exc.value.status_code).should_equal(401)
    expect(exc.value.detail).should_equal("Could not validate credentials")


def test_get_current_user_auto_repairs_first_user_without_roles():
    # Arrange
    first_user = user(1, roles=[])
    admin_role = role("ADMIN")
    token = jwt.encode({"sub": first_user.email}, SECRET_KEY, algorithm=ALGORITHM)
    db = FakeSession({
        User: [FakeQuery(first=first_user), FakeQuery(count=1)],
        Role: [FakeQuery(first=admin_role)],
    })

    # Act
    result = get_current_user(token=token, db=db)

    # Assert
    expect(result).should_be(first_user)
    expect(result.roles[0].name).should_equal("ADMIN")
    expect(db.commits).should_equal(1)
    expect(db.refreshed).should_equal([first_user])


def test_get_current_user_rejects_inactive_user():
    # Arrange
    inactive_user = user(5, active=False)
    token = jwt.encode({"sub": inactive_user.email}, SECRET_KEY, algorithm=ALGORITHM)
    db = FakeSession({User: [FakeQuery(first=inactive_user)]})

    # Act
    with pytest.raises(HTTPException) as exc:
        get_current_user(token=token, db=db)

    # Assert
    assert_that(exc.value.status_code, equal_to(400))
    assert_that(exc.value.detail, equal_to("Inactive user"))


def test_get_current_user_rejects_invalid_token_signature():
    # Arrange
    token = jwt.encode({"sub": "admin@example.com"}, "wrongsecret", algorithm=ALGORITHM)
    db = FakeSession({})

    # Act
    with pytest.raises(HTTPException) as exc:
        get_current_user(token=token, db=db)

    # Assert
    assert_that(exc.value.status_code, equal_to(401))
    assert_that(exc.value.detail, equal_to("Could not validate credentials"))


def test_check_permissions_allows_permission_from_multiple_roles():
    # Arrange
    role_one = role("EVALUADOR", ["MANAGE_USERS"])
    role_two = role("EVALUADOR", ["DELETE_USERS"])
    current_user = user(6, roles=[role_one, role_two])
    dependency = check_permissions("DELETE_USERS")

    # Act
    result = dependency(current_user=current_user)

    # Assert
    expect(result).should_be(current_user)
