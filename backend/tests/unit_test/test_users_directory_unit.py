from src.infrastructure.models import User
from src.interfaces.api.users import get_users

from user_management_helpers import FakeQuery, FakeSession, expect, role, user


def test_get_users_returns_all_registered_users_with_metadata():
    # Arrange
    admin = user(1, "Ada Admin", "ada@example.com", roles=[role("ADMIN")])
    evaluator = user(2, "Eva Evaluator", "eva@example.com", active=False, roles=[role("EVALUADOR")])
    db = FakeSession({User: [FakeQuery(all=[admin, evaluator])]})

    # Act
    result = get_users(db=db, current_user=admin)

    # Assert
    expect(result).should_have_length(2)
    expect(result[0].email).should_equal("ada@example.com")
    expect(result[0].roles[0].name).should_equal("ADMIN")
    expect(result[1].active).should_be(False)


def test_get_users_returns_empty_directory_when_no_users_exist():
    # Arrange
    admin = user(1, roles=[role("ADMIN")])
    db = FakeSession({User: [FakeQuery(all=[])]})

    # Act
    result = get_users(db=db, current_user=admin)

    # Assert
    expect(result).should_equal([])
