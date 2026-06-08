import pytest
from fastapi import HTTPException

from src.infrastructure.models import Role, User
from src.interfaces.api.users import update_user_roles

from user_management_helpers import FakeQuery, FakeSession, expect, role, user


def test_update_user_roles_returns_404_when_user_does_not_exist():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    db = FakeSession({User: [FakeQuery(first=None)]})

    # Act
    with pytest.raises(HTTPException) as exc:
        update_user_roles(99, ["EVALUADOR"], db=db, current_user=admin)

    # Assert
    expect(exc.value.status_code).should_equal(404)
    expect(exc.value.detail).should_equal("User not found")
    expect(db.commits).should_equal(0)


def test_update_user_roles_assigns_requested_roles_to_evaluator():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, roles=[role("EVALUADOR")])
    admin_role = role("ADMIN")
    evaluator_role = role("EVALUADOR")
    db = FakeSession({
        User: [FakeQuery(first=target)],
        Role: [FakeQuery(all=[admin_role, evaluator_role])],
    })

    # Act
    result = update_user_roles(2, ["ADMIN", "EVALUADOR"], db=db, current_user=admin)

    # Assert
    expect(result["message"]).should_equal("Roles updated successfully")
    expect(target.roles).should_equal([admin_role, evaluator_role])
    expect(db.commits).should_equal(1)


def test_update_user_roles_allows_admin_to_keep_admin_role_without_count_check():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, roles=[role("ADMIN")])
    admin_role = role("ADMIN")
    db = FakeSession({
        User: [FakeQuery(first=target)],
        Role: [FakeQuery(all=[admin_role])],
    })

    # Act
    result = update_user_roles(2, ["ADMIN"], db=db, current_user=admin)

    # Assert
    expect(result["message"]).should_equal("Roles updated successfully")
    expect(target.roles).should_equal([admin_role])
    expect(db.commits).should_equal(1)


def test_update_user_roles_allows_removing_admin_when_another_admin_exists():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, roles=[role("ADMIN")])
    evaluator_role = role("EVALUADOR")
    db = FakeSession({
        User: [FakeQuery(first=target), FakeQuery(count=2)],
        Role: [FakeQuery(all=[evaluator_role])],
    })

    # Act
    result = update_user_roles(2, ["EVALUADOR"], db=db, current_user=admin)

    # Assert
    expect(result["message"]).should_equal("Roles updated successfully")
    expect(target.roles).should_equal([evaluator_role])
    expect(db.commits).should_equal(1)


def test_update_user_roles_blocks_revoking_admin_from_last_admin():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, roles=[role("ADMIN")])
    db = FakeSession({
        User: [FakeQuery(first=target), FakeQuery(count=1)],
    })

    # Act
    with pytest.raises(HTTPException) as exc:
        update_user_roles(2, ["EVALUADOR"], db=db, current_user=admin)

    # Assert
    expect(exc.value.status_code).should_equal(400)
    expect(exc.value.detail).should_equal("Cannot remove ADMIN role from the last administrator")
    expect(target.roles[0].name).should_equal("ADMIN")
    expect(db.commits).should_equal(0)


def test_update_user_roles_accepts_empty_matching_role_list_as_current_backend_behavior():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, roles=[role("EVALUADOR")])
    db = FakeSession({
        User: [FakeQuery(first=target)],
        Role: [FakeQuery(all=[])],
    })

    # Act
    result = update_user_roles(2, ["UNKNOWN"], db=db, current_user=admin)

    # Assert
    expect(result["message"]).should_equal("Roles updated successfully")
    expect(target.roles).should_equal([])
    expect(db.commits).should_equal(1)
