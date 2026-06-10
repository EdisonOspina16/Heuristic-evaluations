from types import SimpleNamespace
from unittest.mock import patch

from hamcrest import assert_that, contains_inanyorder, equal_to, has_entries, has_length, is_

from src.domain.schemas import AssignmentCreate
from src.infrastructure.models import EvaluatorProjectAssignment, ProyectoUsuario, User
from src.interfaces.api.proyectos import list_projects, upsert_assignment


class FakeQuery:
    def __init__(self, first_value=None):
        self.first_value = first_value
        self.filters = []

    def filter(self, *criteria):
        self.filters.extend(criteria)
        return self

    def first(self):
        return self.first_value


class FakeSession:
    def __init__(self, queries):
        self.queries = {model: list(values) for model, values in queries.items()}
        self.added = []
        self.commits = 0
        self.refreshed = []

    def query(self, model):
        queue = self.queries.get(model, [])
        if not queue:
            raise AssertionError(f"No fake query configured for {model}")
        return queue.pop(0)

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.commits += 1

    def refresh(self, obj):
        if getattr(obj, "id", None) is None:
            obj.id = 501
        self.refreshed.append(obj)


def _role(name):
    return SimpleNamespace(name=name)


def _user(user_id=7, roles=None):
    return SimpleNamespace(id=user_id, email="eva@example.com", roles=roles or [_role("EVALUADOR")])


def test_upsert_assignment_creates_assignment_and_project_membership_with_allowed_types():
    # Arrange
    evaluator = _user()
    db = FakeSession(
        {
            User: [FakeQuery(evaluator)],
            EvaluatorProjectAssignment: [FakeQuery(None)],
            ProyectoUsuario: [FakeQuery(None)],
        }
    )
    assignment = AssignmentCreate(
        evaluator_id=7,
        project_id=10,
        role="UI",
        allowed_evaluation_types=["UI", "UX"],
    )

    with patch("src.interfaces.api.proyectos.ProyectoRepository.get_by_id", return_value=SimpleNamespace(id=10)):
        # Act
        response = upsert_assignment(10, assignment, db=db, current_user=_user(1, [_role("ADMIN")]))

    # Assert
    assert_that(response, has_entries(evaluator_id=7, project_id=10, role="UI"))
    assert_that(response["allowed_evaluation_types"], contains_inanyorder("UI", "UX"))
    assert_that(db.added, has_length(2))
    assert_that(any(isinstance(item, EvaluatorProjectAssignment) for item in db.added), is_(True))
    assert_that(any(isinstance(item, ProyectoUsuario) for item in db.added), is_(True))
    assert_that(db.commits, equal_to(1))


def test_upsert_assignment_updates_existing_assignment_without_duplicating_membership():
    # Arrange
    existing_assignment = EvaluatorProjectAssignment(
        id=88,
        evaluator_id=7,
        project_id=10,
        role="UI",
        allowed_evaluation_types='["UI"]',
    )
    existing_membership = ProyectoUsuario(proyecto_id=10, usuario_id=7, enfoque="UI")
    db = FakeSession(
        {
            User: [FakeQuery(_user())],
            EvaluatorProjectAssignment: [FakeQuery(existing_assignment)],
            ProyectoUsuario: [FakeQuery(existing_membership)],
        }
    )
    assignment = AssignmentCreate(
        evaluator_id=7,
        project_id=10,
        role="Contenido",
        allowed_evaluation_types=["Self-Assessment Manikin"],
    )

    with patch("src.interfaces.api.proyectos.ProyectoRepository.get_by_id", return_value=SimpleNamespace(id=10)):
        # Act
        response = upsert_assignment(10, assignment, db=db, current_user=_user(1, [_role("ADMIN")]))

    # Assert
    assert_that(response["id"], equal_to(88))
    assert_that(response["role"], equal_to("Contenido"))
    assert_that(response["allowed_evaluation_types"], equal_to(["Self-Assessment Manikin"]))
    assert_that(existing_membership.enfoque, equal_to("Contenido"))
    assert_that(db.added, has_length(0))
    assert_that(db.commits, equal_to(1))


def test_list_projects_uses_all_projects_for_admin_and_assigned_projects_for_evaluator():
    # Arrange
    admin = _user(1, [_role("ADMIN")])
    evaluator = _user(7, [_role("EVALUADOR")])
    admin_projects = [SimpleNamespace(id=1), SimpleNamespace(id=2)]
    evaluator_projects = [SimpleNamespace(id=2), SimpleNamespace(id=3)]

    with patch("src.interfaces.api.proyectos.ProyectoRepository") as repo_cls:
        repo = repo_cls.return_value
        repo.get_all.return_value = admin_projects
        repo.get_by_user.return_value = evaluator_projects

        # Act
        admin_result = list_projects(db=SimpleNamespace(), current_user=admin)
        evaluator_result = list_projects(db=SimpleNamespace(), current_user=evaluator)

    # Assert
    assert_that(admin_result, equal_to(admin_projects))
    assert_that(evaluator_result, equal_to(evaluator_projects))
    repo.get_all.assert_called_once_with()
    repo.get_by_user.assert_called_once_with(7)
