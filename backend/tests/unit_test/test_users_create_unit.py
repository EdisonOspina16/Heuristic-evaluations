import pytest
from fastapi import HTTPException

from src.domain.schemas import UsuarioCreate
from src.infrastructure.models import Role, User
from src.interfaces.api import users as users_module

from user_management_helpers import FakeQuery, FakeSession, expect, role, user


def build_payload(email: str = "new@example.com"):
    return UsuarioCreate(nombre="New User", email=email, password="Secret123!")


def test_create_user_hashes_password_sets_active_and_assigns_requested_admin_role(monkeypatch):
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    admin_role = Role(id=1, name="ADMIN", description="ADMIN role")
    db = FakeSession({
        User: [FakeQuery(first=None)],
        Role: [FakeQuery(first=admin_role)],
    })
    monkeypatch.setattr(users_module, "get_password_hash", lambda password: "hashed-secret")

    # Act
    result = users_module.create_user(build_payload(), role_name="ADMIN", db=db, current_user=admin)

    # Assert
    expect(result.email).should_equal("new@example.com")
    expect(result.password_hash).should_equal("hashed-secret")
    expect(result.active).should_be(True)
    expect(result.roles[0].name).should_equal("ADMIN")
    expect(db.flushed).should_be(True)
    expect(db.commits).should_equal(1)


def test_create_user_rejects_duplicate_email_without_hashing_or_committing(monkeypatch):
    # Arrange
    existing = user(2, email="taken@example.com")
    admin = user(1, roles=[role("ADMIN")])
    db = FakeSession({User: [FakeQuery(first=existing)]})
    hash_calls = []
    monkeypatch.setattr(users_module, "get_password_hash", lambda password: hash_calls.append(password))

    # Act
    with pytest.raises(HTTPException) as exc:
        users_module.create_user(build_payload("taken@example.com"), db=db, current_user=admin)

    # Assert
    expect(exc.value.status_code).should_equal(400)
    expect(exc.value.detail).should_equal("Email already registered")
    expect(hash_calls).should_equal([])
    expect(db.commits).should_equal(0)


def test_create_user_falls_back_to_evaluator_when_requested_role_does_not_exist(monkeypatch):
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    evaluator_role = Role(id=2, name="EVALUADOR", description="EVALUADOR role")
    db = FakeSession({
        User: [FakeQuery(first=None)],
        Role: [FakeQuery(first=None), FakeQuery(first=evaluator_role)],
    })
    monkeypatch.setattr(users_module, "get_password_hash", lambda password: "hashed-secret")

    # Act
    result = users_module.create_user(build_payload(), role_name="UNKNOWN", db=db, current_user=admin)

    # Assert
    expect(result.roles[0].name).should_equal("EVALUADOR")
    expect(db.commits).should_equal(1)


def test_create_user_commits_even_when_no_role_can_be_assigned(monkeypatch):
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    db = FakeSession({
        User: [FakeQuery(first=None)],
        Role: [FakeQuery(first=None), FakeQuery(first=None)],
    })
    monkeypatch.setattr(users_module, "get_password_hash", lambda password: "hashed-secret")

    # Act
    result = users_module.create_user(build_payload(), role_name="UNKNOWN", db=db, current_user=admin)

    # Assert
    expect(result.roles).should_equal([])
    expect(db.commits).should_equal(1)
