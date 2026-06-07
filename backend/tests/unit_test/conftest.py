import pytest
from fastapi.testclient import TestClient

import pytest
from unittest.mock import patch, MagicMock

# ── Mockear create_all 
with patch("sqlalchemy.sql.schema.MetaData.create_all"):
    from main import app

from fastapi.testclient import TestClient
from src.infrastructure.database import get_db


@pytest.fixture
def mock_db():
    #Sesión de BD mockeada
    db = MagicMock()
    db.query.return_value = MagicMock()
    db.add = MagicMock()
    db.commit = MagicMock()
    db.refresh = MagicMock()
    db.close = MagicMock()
    return db

@pytest.fixture
def client(mock_db):
    # Cliente HTTP con BD mockeada
    app.dependency_overrides[get_db] = lambda: mock_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
