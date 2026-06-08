import pytest
from fastapi import HTTPException

from src.infrastructure.models import Role, User
from src.interfaces.api.users import update_user_status

from user_management_helpers import FakeQuery, FakeSession, expect, role, user


def test_update_user_status_returns_404_when_user_does_not_exist():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    db = FakeSession({User: [FakeQuery(first=None)]})

    # Act
    with pytest.raises(HTTPException) as exc:
        update_user_status(99, active=True, db=db, current_user=admin)

    # Assert
    expect(exc.value.status_code).should_equal(404)
    expect(exc.value.detail).should_equal("User not found")
    expect(db.commits).should_equal(0)


def test_update_user_status_activates_inactive_user_without_admin_count_check():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, active=False, roles=[role("ADMIN")])
    db = FakeSession({User: [FakeQuery(first=target)]})

    # Act
    result = update_user_status(2, active=True, db=db, current_user=admin)

    # Assert
    expect(result.active).should_be(True)
    expect(db.commits).should_equal(1)


def test_update_user_status_deactivates_evaluator_without_admin_count_check():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, active=True, roles=[role("EVALUADOR")])
    db = FakeSession({User: [FakeQuery(first=target)]})

    # Act
    result = update_user_status(2, active=False, db=db, current_user=admin)

    # Assert
    expect(result.active).should_be(False)
    expect(db.commits).should_equal(1)


def test_update_user_status_deactivates_admin_when_another_active_admin_exists():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, active=True, roles=[role("ADMIN")])
    db = FakeSession({
        User: [FakeQuery(first=target), FakeQuery(count=2)],
    })

    # Act
    result = update_user_status(2, active=False, db=db, current_user=admin)

    # Assert
    expect(result.active).should_be(False)
    expect(db.commits).should_equal(1)


def test_update_user_status_blocks_deactivation_of_last_active_admin():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, active=True, roles=[role("ADMIN")])
    db = FakeSession({
        User: [FakeQuery(first=target), FakeQuery(count=1)],
    })

    # Act
    with pytest.raises(HTTPException) as exc:
        update_user_status(2, active=False, db=db, current_user=admin)

    # Assert
    expect(exc.value.status_code).should_equal(400)
    expect(exc.value.detail).should_equal("Cannot deactivate the last active administrator")
    expect(target.active).should_be(True)
    expect(db.commits).should_equal(0)
