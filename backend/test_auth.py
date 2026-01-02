from auth import get_password_hash, verify_password
import sys

def test_auth():
    print("Testing Password Hashing...")
    password = "testpassword123"
    
    try:
        # 1. Hash the password
        hashed = get_password_hash(password)
        print(f"Hash created: {hashed}")
        
        # 2. Verify the password
        is_valid = verify_password(password, hashed)
        print(f"Verification Result: {is_valid}")
        
        if is_valid:
            print("SUCCESS: Password flow is working.")
        else:
            print("FAILURE: Verification returned False.")
            
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_auth()
