import requests

def test_add_vehicle():
    base_url = "http://localhost:8000"
    
    # 1. Login
    resp = requests.post(f"{base_url}/token", data={"username": "admin@example.com", "password": "admin123"})
    if resp.status_code != 200:
        print("Login failed:", resp.text)
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get Zones
    resp = requests.get(f"{base_url}/zones", headers=headers)
    zones = resp.json()
    print("Zones:", zones)
    zone_id = zones[0]["id"] if zones else None
    
    # 3. Add Vehicle
    payload = {
        "vehicle_number": "TEST-VEH-001",
        "max_volume_m3": 10.0,
        "max_weight_kg": 1000.0,
        "zone_id": zone_id
    }
    
    resp = requests.post(f"{base_url}/vehicles", json=payload, headers=headers)
    if resp.status_code == 200:
        print("Vehicle added successfully:", resp.json())
    else:
        print(f"Failed to add vehicle ({resp.status_code}):", resp.text)

if __name__ == "__main__":
    test_add_vehicle()
