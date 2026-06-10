from typing import Protocol, Optional, Any


class UserRepository(Protocol):
    def get_by_email(self, email: str) -> Optional[Any]:
        ...

    def count_users(self) -> int:
        ...

    def add_role_to_user(self, user: Any, role: Any) -> None:
        ...


class RoleRepository(Protocol):
    def get_by_name(self, name: str) -> Optional[Any]:
        ...
