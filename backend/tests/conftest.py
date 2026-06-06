import pytest
from fastapi.testclient import TestClient

from main import app
from src.infrastructure.database import get_db


@pytest.fixture
def client():
    def override_get_db():
        yield object()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
