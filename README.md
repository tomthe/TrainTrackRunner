# Train Track Runner

Static browser endless runner with local multiplayer, ramps, slow trains, jetpacks, and magnets.

## Run locally

Serve the folder over HTTP, for example:

```powershell
python -m http.server 8123
```

Then open `http://127.0.0.1:8123/`.

## GitHub Pages

1. Create a GitHub repository and push this folder to `main` or `master`.
2. In GitHub, open `Settings -> Pages` and set the source to `GitHub Actions`.
3. Push again if needed. The included workflow deploys the static site automatically.
4. Your game will be available at `https://<your-user>.github.io/<repo-name>/`.

## Install as an app

Open the deployed site in Chrome or Edge and use the browser's install option in the address bar or app menu.