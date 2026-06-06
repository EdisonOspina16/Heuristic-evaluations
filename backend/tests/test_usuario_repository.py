from types import SimpleNamespace

from src.infrastructure.models import Role, User
from src.infrastructure.repositories.usuario_repository import UsuarioRepository


class FakeRoleQuery:
    def __init__(self, roles_by_name: dict[str, Role]):
        self.roles_by_name = roles_by_name
        self.role_name = None

    def filter(self, *criteria):
        for criterion in criteria:
            right = getattr(criterion, "right", None)
            value = getattr(right, "value", None)
            if value:
                self.role_name = value
                return self

            criterion_text = str(criterion)
            if "ADMIN" in criterion_text:
                self.role_name = "ADMIN"
            elif "EVALUADOR" in criterion_text:
                self.role_name = "EVALUADOR"
        return self

    def first(self):
        return self.roles_by_name.get(self.role_name)


class FakeUserQuery:
    def __init__(self, count_value: int):
        self.count_value = count_value

    def count(self):
        return self.count_value


class FakeSession:
    def __init__(self, count_value: int, roles_by_name: dict[str, Role]):
        self.count_value = count_value
        self.roles_by_name = roles_by_name
        self.added = []
        self.committed = False

    def query(self, model):
        if model is User:
            return FakeUserQuery(self.count_value)
        if model is Role:
            return FakeRoleQuery(self.roles_by_name)
        raise AssertionError(f"Unexpected model queried: {model}")

    def add(self, obj):
        self.added.append(obj)

    def flush(self):
        return None

    def commit(self):
        self.committed = True

    def refresh(self, obj):
        return None


def build_user_create(nombre: str, email: str, password: str):
    return SimpleNamespace(nombre=nombre, email=email, password=password)


def test_create_first_user_assigns_admin_role(monkeypatch):
    # Arrange
    admin_role = Role(id=1, name="ADMIN", description="Administrador")
    evaluator_role = Role(id=2, name="EVALUADOR", description="Evaluador")
    fake_db = FakeSession(0, {"ADMIN": admin_role, "EVALUADOR": evaluator_role})
    monkeypatch.setattr(
        "src.infrastructure.repositories.usuario_repository.get_password_hash",
        lambda password: "hashed-password",
    )
    repository = UsuarioRepository(fake_db)

    # Act
    user = repository.create(build_user_create("Admin", "admin@example.com", "Secret123!"))

    # Assert
    assert fake_db.committed is True
    assert user.roles[0].name == "ADMIN"
    assert user.email == "admin@example.com"


def test_create_second_user_assigns_evaluator_role(monkeypatch):
    # Arrange
    admin_role = Role(id=1, name="ADMIN", description="Administrador")
    evaluator_role = Role(id=2, name="EVALUADOR", description="Evaluador")
    fake_db = FakeSession(1, {"ADMIN": admin_role, "EVALUADOR": evaluator_role})
    monkeypatch.setattr(
        "src.infrastructure.repositories.usuario_repository.get_password_hash",
        lambda password: "hashed-password",
    )
    repository = UsuarioRepository(fake_db)

    # Act
    user = repository.create(build_user_create("Evaluator", "eval@example.com", "Secret123!"))

    # Assert
    assert fake_db.committed is True
    assert user.roles[0].name == "EVALUADOR"
    assert user.email == "eval@example.com"
