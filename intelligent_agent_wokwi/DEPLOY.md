# Deployment Instructions

## Using Ngrok

To deploy this project and make it accessible remotely, you can use [ngrok](https://ngrok.com/).

### Prerequisites

1.  Install ngrok:
    -   Download from [ngrok.com](https://ngrok.com/download)
    -   Or use a package manager (e.g., `choco install ngrok`)

2.  Authenticate ngrok (first time only):
    ```bash
    ngrok config add-authtoken <YOUR_AUTH_TOKEN>
    ```

### Running the Deployment

1.  Start your local web server (if not already running):
    ```bash
    python web/server.py
    ```

2.  Start ngrok to tunnel port 8000:
    ```bash
    ngrok http 8000
    ```

3.  Copy the forwarding URL provided by ngrok (e.g., `https://xxxx-xxxx.ngrok-free.app`).

### Current Deployment

The project is currently deployed at:
**[https://dreamily-scrutable-collen.ngrok-free.dev](https://dreamily-scrutable-collen.ngrok-free.dev)**

(Note: This link is temporary and will expire when the ngrok session is stopped).
