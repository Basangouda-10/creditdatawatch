
import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/drive']

CREDENTIALS_FILE = 'credentials/client-credentials.json'
TOKEN_FILE = 'credentials/token.json'

def main():
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists(TOKEN_FILE):
        print(f"Token file found at {TOKEN_FILE}")
        # In a real app we might verify it here, but for now just notify
        return

    if not os.path.exists(CREDENTIALS_FILE):
        print(f"CRITICAL: Credentials file not found at {CREDENTIALS_FILE}")
        print("Please ensure your client-credentials.json is in server/credentials/")
        return

    print("Starting OAuth flow...")
    flow = InstalledAppFlow.from_client_secrets_file(
        CREDENTIALS_FILE, SCOPES)
        
    # run_local_server will open a browser to ask for permission
    creds = flow.run_local_server(port=0)
    
    # Save the credentials for the next run
    with open(TOKEN_FILE, 'w') as token:
        token.write(creds.to_json())
        
    print(f"Success! Credential token saved to {TOKEN_FILE}")

if __name__ == '__main__':
    main()
