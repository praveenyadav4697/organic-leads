import asyncio
import base64
import uuid
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.modules.tracking.dependencies import get_tracking_service
from app.modules.tracking.schemas import FormTestRequest, TrackingStatusEnum, EventTestRequest
from app.modules.tracking.service import TrackingService
from app.shared.utils.encryption import encrypt_value
from app.modules.website.wp_client import WordPressClient


class DummyDB:
    def __init__(self):
        self.last_obj = None

    def add(self, obj):
        self.last_obj = obj

    async def flush(self):
        if self.last_obj is None:
            return None
        if getattr(self.last_obj, "id", None) is None:
            self.last_obj.id = uuid.uuid4()
        if getattr(self.last_obj, "created_at", None) is None:
            self.last_obj.created_at = datetime.utcnow()
        if getattr(self.last_obj, "updated_at", None) is None:
            self.last_obj.updated_at = datetime.utcnow()


def test_forms_discovery_uses_connector_shortcodes_and_installed_plugins():
    async def run_test():
        service = TrackingService(DummyDB())

        async def fake_get_website(_website_id):
            return SimpleNamespace(url="https://example.com", wp_admin_url=None, wp_username=None, wp_app_password=None)

        service._get_website = fake_get_website
        service.validation_repo.get_by_website = AsyncMock(return_value=[])
        service.destination_repo.get_by_website = AsyncMock(return_value=[])

        class FakeWordPressClient:
            def __init__(self, *args, **kwargs):
                self.args = args

            async def get_forms(self):
                return {
                    "forms": [
                        {
                            "id": "1",
                            "name": "Contact",
                            "plugin": "contact-form-7",
                            "shortcode": "[contact-form-7 id='1']",
                            "fields": [],
                            "destinations": [],
                            "last_modified": "2024-01-01T00:00:00Z",
                        }
                    ],
                    "total": 1,
                }

            async def get_shortcodes(self):
                return {"shortcodes": [{"shortcode": "[contact-form-7 id='1']", "form_id": "1"}], "total": 1}

            async def close(self):
                return None

        import app.modules.tracking.service as tracking_service_module
        tracking_service_module.WordPressClient = FakeWordPressClient

        result = await service.get_forms_discovery("11111111-1111-1111-1111-111111111111")

        assert result.total == 1
        assert result.items[0]["shortcodes"][0]["shortcode"] == "[contact-form-7 id='1']"
        assert result.items[0]["installed_form_plugins"] == ["contact-form-7"]

    asyncio.run(run_test())


def test_form_test_service_returns_form_test_response():
    async def run_test():
        service = TrackingService(DummyDB())

        async def fake_get_website(_website_id):
            return SimpleNamespace(url="https://example.com")

        async def fake_run_event_test(_website_id, req):
            return SimpleNamespace(
                status=TrackingStatusEnum.active,
                success=True,
                response_time_ms=123,
                event_id="evt_123",
                error_message=None,
            )

        service._get_website = fake_get_website
        service.run_event_test = fake_run_event_test

        result = await service.test_form_submission(
            "11111111-1111-1111-1111-111111111111",
            "contact-form",
            FormTestRequest(destination_type="email", test_data={"foo": "bar"}),
        )

        assert result.form_id == "contact-form"
        assert result.destination_type == "email"
        assert result.status == TrackingStatusEnum.active.value
        assert result.success is True
        assert result.response_time_ms == 123
        assert result.event_id == "evt_123"

    asyncio.run(run_test())


def test_wordpress_client_decrypts_app_password_for_auth():
    client = WordPressClient(
        "https://example.com/wp-admin",
        "demo-user",
        encrypt_value("demo-app-password"),
    )

    headers = client._auth_headers()
    decoded = base64.b64decode(headers["Authorization"].split()[1]).decode()

    assert decoded == "demo-user:demo-app-password"


def test_run_event_test_returns_active_status_without_name_error():
    async def run_test():
        service = TrackingService(DummyDB())

        async def fake_get_website(_website_id):
            return SimpleNamespace(url="https://example.com")

        service._get_website = fake_get_website

        class FakeAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def get(self, url):
                return SimpleNamespace(status_code=200, elapsed=SimpleNamespace(total_seconds=lambda: 0.05))

            async def aclose(self):
                return None

        import httpx
        httpx.AsyncClient = FakeAsyncClient

        result = await service.run_event_test(
            "11111111-1111-1111-1111-111111111111",
            EventTestRequest(event_type="form_submit", event_name="Test submission", destination="https://example.com"),
        )

        assert result.status == TrackingStatusEnum.active
        assert result.success is True

    asyncio.run(run_test())


def test_default_tracking_scripts_path_uses_default_website_alias():
    from app.modules.tracking.router import router as tracking_router

    app = FastAPI()
    app.include_router(tracking_router, prefix="/api/v1")

    class FakeService:
        async def resolve_website_id(self, website_id):
            assert website_id is None
            return "11111111-1111-1111-1111-111111111111"

        async def get_tracking_scripts(self, website_id):
            return [{"provider": "ga4", "tracking_id": "G-123"}]

    async def override_get_tracking_service():
        return FakeService()

    app.dependency_overrides[get_tracking_service] = override_get_tracking_service

    with TestClient(app) as client:
        response = client.get("/api/v1/tracking/default/scripts")

    assert response.status_code == 200
    assert response.json() == [{"provider": "ga4", "tracking_id": "G-123"}]


def test_tracking_scripts_service_survives_audit_logging_failure():
    async def run_test():
        class FailingAuditDB:
            def add(self, obj):
                self.last_obj = obj

            async def flush(self):
                raise RuntimeError("missing tracking_audit_logs table")

        service = TrackingService(FailingAuditDB())

        async def fake_get_website(_website_id):
            return SimpleNamespace(url="https://example.com", wp_admin_url=None, wp_username=None, wp_app_password=None)

        service._get_website = fake_get_website
        service.script_repo.get_by_website = AsyncMock(return_value=[])

        class FakeWordPressClient:
            def __init__(self, *args, **kwargs):
                self.args = args

            async def get_tracking_scripts(self):
                return {"scripts": [{"provider": "ga4", "tracking_id": "G-123"}], "connected_providers": [], "installed_tracking_plugins": []}

            async def close(self):
                return None

        import app.modules.tracking.service as tracking_service_module
        tracking_service_module.WordPressClient = FakeWordPressClient

        result = await service.get_tracking_scripts("11111111-1111-1111-1111-111111111111")

        assert result[0]["provider"] == "ga4"
        assert result[0]["tracking_id"] == "G-123"

    asyncio.run(run_test())
