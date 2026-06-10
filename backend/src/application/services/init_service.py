from src.domain.repositories import UserRepository, RoleRepository


def assign_admin_if_first_user(user_repo: UserRepository, role_repo: RoleRepository, user) -> None:
    """
    Move the "assign ADMIN to first user" rule here so it is not executed during
    authentication. This function preserves the exact same business rule.
    """
    if getattr(user, "roles", None):
        return

    total_users = user_repo.count_users()
    if total_users == 1:
        admin_role = role_repo.get_by_name("ADMIN")
        if admin_role:
            user_repo.add_role_to_user(user, admin_role)
