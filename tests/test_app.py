from fastapi.testclient import TestClient
from uuid import uuid4
from src.app import app

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect some known activity keys
    assert "Tennis Club" in data


def test_signup_and_unregister_flow():
    activity = "Tennis Club"
    email = f"test-{uuid4().hex[:8]}@example.com"

    # Sign up
    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 200
    assert "Signed up" in r.json().get("message", "")

    # Ensure participant appears in the activity
    resp = client.get("/activities")
    assert email in resp.json()[activity]["participants"]

    # Signing up same email again should fail
    r_dup = client.post(f"/activities/{activity}/signup?email={email}")
    assert r_dup.status_code == 400

    # Unregister
    r_un = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert r_un.status_code == 200

    # Ensure participant removed
    resp2 = client.get("/activities")
    assert email not in resp2.json()[activity]["participants"]

    # Unregistering again should fail
    r_un2 = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert r_un2.status_code == 400
