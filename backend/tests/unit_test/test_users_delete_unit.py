import pytest
from fastapi import HTTPException

from src.infrastructure.models import User
from src.interfaces.api.users import delete_user

from user_management_helpers import FakeQuery, FakeSession, expect, role, user


def test_delete_user_returns_404_when_user_does_not_exist():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    db = FakeSession({User: [FakeQuery(first=None)]})

    # Act
    with pytest.raises(HTTPException) as exc:
        delete_user(99, db=db, current_user=admin)

    # Assert
    expect(exc.value.status_code).should_equal(404)
    expect(exc.value.detail).should_equal("User not found")
    expect(db.deleted).should_equal([])


def test_delete_user_deletes_evaluator_without_admin_count_check():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, roles=[role("EVALUADOR")])
    db = FakeSession({User: [FakeQuery(first=target)]})

    # Act
    result = delete_user(2, db=db, current_user=admin)

    # Assert
    expect(result["message"]).should_equal("User deleted successfully")
    expect(db.deleted).should_equal([target])
    expect(db.commits).should_equal(1)


def test_delete_user_deletes_admin_when_another_admin_exists():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, roles=[role("ADMIN")])
    db = FakeSession({
        User: [FakeQuery(first=target), FakeQuery(count=2)],
    })

    # Act
    result = delete_user(2, db=db, current_user=admin)

    # Assert
    expect(result["message"]).should_equal("User deleted successfully")
    expect(db.deleted).should_equal([target])
    expect(db.commits).should_equal(1)


def test_delete_user_blocks_physical_delete_of_last_registered_admin():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    target = user(2, roles=[role("ADMIN")])
    db = FakeSession({
        User: [FakeQuery(first=target), FakeQuery(count=1)],
    })

    # Act
    with pytest.raises(HTTPException) as exc:
        delete_user(2, db=db, current_user=admin)

    # Assert
    expect(exc.value.status_code).should_equal(400)
    expect(exc.value.detail).should_equal("Cannot delete the last administrator")
    expect(db.deleted).should_equal([])
    expect(db.commits).should_equal(0)
