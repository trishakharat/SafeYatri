import os
import time
import json
import requests

BASE_URL = os.getenv("BASE_URL", "http://localhost").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("ADMIN_PASS", "SafeYatri@2024")

USERS = [
    {"username": "dispatcher", "email": "dispatcher@safeyatri.gov.in", "password": "SafeYatri@2024", "role": "dispatcher"},
    {"username": "police", "email": "police@safeyatri.gov.in", "password": "SafeYatri@2024", "role": "police"},
    {"username": "tourism", "email": "tourism@safeyatri.gov.in", "password": "SafeYatri@2024", "role": "tourism_officer"},
    {"username": "auditor", "email": "auditor@safeyatri.gov.in", "password": "SafeYatri@2024", "role": "auditor"},
]

TOURISTS = [
    {"name": "Alice Kumar", "passport_number": "P1234567", "nationality": "IN", "phone": "+911234567890"},
    {"name": "Bob Singh", "passport_number": "P2234567", "nationality": "IN", "phone": "+911234567891"},
    {"name": "Clara Roy", "passport_number": "P3234567", "nationality": "IN", "phone": "+911234567892"},
    {"name": "David Chen", "passport_number": "X1234567", "nationality": "US", "phone": "+12025550123"},
    {"name": "Eva Li", "passport_number": "X2234567", "nationality": "SG", "phone": "+6591234567"},
]


def login(username, password):
    r = requests.post(f"{API}/auth/login", json={"username": username, "password": password})
    r.raise_for_status()
    return r.json()["access_token"]


def create_user(token, user):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = requests.post(f"{API}/auth/create-user", json=user, headers=headers)
        if r.status_code == 409:
            print(f"[seed] user exists: {user['username']}")
        else:
            r.raise_for_status()
            print(f"[seed] created user: {user['username']}")
    except Exception as e:
        print(f"[seed] create user failed {user['username']}: {e}")


def register_tourist(t):
    try:
        r = requests.post(f"{API}/tourists/register", json=t)
        r.raise_for_status()
        did = r.json().get("digital_id")
        print(f"[seed] registered tourist {t['name']} -> {did}")
    except Exception as e:
        print(f"[seed] register tourist failed {t.get('name')}: {e}")


def main():
    print(f"[seed] base url: {BASE_URL}")
    # wait for backend
    for i in range(30):
        try:
            h = requests.get(f"{BASE_URL}/health", timeout=2)
            if h.ok:
                break
        except Exception:
            pass
        time.sleep(1)
    else:
        print("[seed] backend health timeout")

    # admin login
    try:
        token = login(ADMIN_USER, ADMIN_PASS)
        print("[seed] admin login ok")
    except Exception as e:
        print(f"[seed] admin login failed: {e}")
        return

    # create users
    for u in USERS:
        create_user(token, u)

    # register tourists
    for t in TOURISTS:
        register_tourist(t)

    print("[seed] done")


if __name__ == "__main__":
    main()
