import requests
import uuid
import sys

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASS = "admin123"

def get_admin_token():
    try:
        resp = requests.post(f"{BASE_URL}/token", data={"username": ADMIN_EMAIL, "password": ADMIN_PASS})
        if resp.status_code != 200:
            print(f"Admin login failed: {resp.text}")
            return None
        return resp.json()["access_token"]
    except Exception as e:
        print(f"Connection failed: {e}")
        return None

def verify_driver_flow():
    token = get_admin_token()
    if not token:
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}
    emp_id = f"EMP_{uuid.uuid4().hex[:6]}"
    
    # 1. Create Driver
    print(f"Creating driver with Employee ID: {emp_id}")
    driver_data = {
        "name": "Test Driver",
        "employee_id": emp_id,
        "vehicle_number": "KA-55-TE-9999"
    }
    resp = requests.post(f"{BASE_URL}/drivers", json=driver_data, headers=headers)
    if resp.status_code != 200:
        print(f"Create driver failed: {resp.text}")
        sys.exit(1)
    
    driver_info = resp.json()
    print(f"Driver created: {driver_info}")
    
    if driver_info.get("employee_id") != emp_id:
        print("ERROR: employee_id mismatch in response")
        sys.exit(1)
        
    # 2. Login as Driver
    print("Attempting Driver Login...")
    login_data = {
        "employee_id": emp_id,
        "password": "Logistics@123" 
    }
    resp = requests.post(f"{BASE_URL}/driver/login", json=login_data)
    if resp.status_code != 200:
        print(f"Driver login failed: {resp.text}")
        sys.exit(1)
    else:
        print("Driver login SUCCESS")
        print(f"Token: {resp.json().get('access_token')[:20]}...")

    # 3. Cleanup
    driver_id = driver_info["id"]
    print(f"Deleting driver {driver_id}...")
    resp = requests.delete(f"{BASE_URL}/drivers/{driver_id}", headers=headers)
    if resp.status_code == 200:
        print("Driver deleted successfully")
    else:
        print(f"Delete failed: {resp.text}")

if __name__ == "__main__":
    verify_driver_flow()
