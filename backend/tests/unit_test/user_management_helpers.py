from datetime import datetime
from types import SimpleNamespace


def role(name: str, permissions: list | None = None):
    return SimpleNamespace(
        id=1 if name == "ADMIN" else 2,
        name=name,
        description=f"{name} role",
        permissions=[permission(code) for code in (permissions or [])],
    )


def permission(code: str):
    return SimpleNamespace(
        id=abs(hash(code)) % 10000,
        code=code,
        name=code.replace("_", " ").title(),
        description=f"{code} permission",
    )


def user(
    user_id: int = 1,
    nombre: str = "Admin User",
    email: str = "admin@example.com",
    active: bool = True,
    roles: list | None = None,
    direct_permissions: list | None = None,
):
    return SimpleNamespace(
        id=user_id,
        nombre=nombre,
        email=email,
        active=active,
        password_hash="hashed-password",
        created_at=datetime(2026, 6, 7, 12, 0, 0),
        roles=roles or [],
        direct_permissions=direct_permissions or [],
    )


class Fluent:
    def __init__(self, actual):
        self.actual = actual

    def should_equal(self, expected):
        assert self.actual == expected
        return self

    def should_be(self, expected):
        assert self.actual is expected
        return self

    def should_contain(self, expected):
        assert expected in self.actual
        return self

    def should_have_length(self, expected):
        assert len(self.actual) == expected
        return self


def expect(actual):
    return Fluent(actual)


class FakeQuery:
    def __init__(self, *, first=None, all=None, count=None):
        self.first_value = first
        self.all_value = [] if all is None else all
        self.count_value = 0 if count is None else count
        self.filters = []
        self.joined = False

    def filter(self, *criteria):
        self.filters.extend(criteria)
        return self

    def join(self, *args, **kwargs):
        self.joined = True
        return self

    def first(self):
        return self.first_value

    def all(self):
        return self.all_value

    def count(self):
        return self.count_value


class FakeSession:
    def __init__(self, queries: dict):
        self.queries = {model: list(values) for model, values in queries.items()}
        self.added = []
        self.deleted = []
        self.commits = 0
        self.flushed = False
        self.refreshed = []

    def query(self, model):
        queue = self.queries.get(model, [])
        if not queue:
            raise AssertionError(f"No fake query configured for {model}")
        return queue.pop(0)

    def add(self, obj):
        self.added.append(obj)

    def delete(self, obj):
        self.deleted.append(obj)

    def flush(self):
        self.flushed = True

    def commit(self):
        self.commits += 1

    def refresh(self, obj):
        self.refreshed.append(obj)
