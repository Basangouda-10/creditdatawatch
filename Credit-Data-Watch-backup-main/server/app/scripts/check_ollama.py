import requests
import json

def main():
    payload = {
        "model": "llama3",
        "prompt": "Return {\"score\": 50, \"grade\": \"B\", \"risk_level\": \"Medium\", \"ai_summary\": \"Test response.\"}",
        "stream": False
    }
    try:
        r = requests.post("http://localhost:11434/api/generate", json=payload, timeout=20)
        print("status_code=", r.status_code)
        print("raw_text=", r.text)
        try:
            print("json=", json.dumps(r.json(), ensure_ascii=False))
        except Exception as e:
            print("json_parse_error=", str(e))
    except Exception as e:
        print("error=", str(e))

if __name__ == "__main__":
    main()
