"""
ngrok_tunnel.py  –  Strategy Forge Insight
-------------------------------------------
Starts two ngrok tunnels (frontend :8080 + backend :8000) and writes
the live backend URL into frontend/.env so the Vite dev-server uses it.

Priority order for the ngrok binary:
  1. System PATH   (e.g. installed from Microsoft Store or manually)
  2. pyngrok's default install location (auto-downloaded by pyngrok)
  3. NGROK_BIN env-var  (custom path)

Usage:
    python ngrok_tunnel.py
"""

import os
import sys
import shutil
import subprocess
import time
import threading

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────
AUTHTOKEN     = "3Bh60fGHrlqVOzdg5gbZUrdTZdH_81u1bsCNGAJo9Gg5gKfuv"
FRONTEND_PORT = 8080
BACKEND_PORT  = 8000
PROJECT_ROOT  = os.path.dirname(os.path.abspath(__file__))
FRONTEND_ENV  = os.path.join(PROJECT_ROOT, "frontend", ".env")
NGROK_YML     = os.path.join(PROJECT_ROOT, "ngrok.yml")

BANNER = """
╔══════════════════════════════════════════════════════════╗
║       Strategy Forge Insight  —  ngrok Tunnel Manager    ║
╚══════════════════════════════════════════════════════════╝
"""

# ─────────────────────────────────────────────────────────────────────────────
# Utilities
# ─────────────────────────────────────────────────────────────────────────────

def patch_frontend_env(env_path: str, new_api_url: str) -> None:
    """Replace (or add) the VITE_API_URL line in the given .env file."""
    lines: list[str] = []
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

    updated: list[str] = []
    found = False
    for line in lines:
        if line.startswith("VITE_API_URL="):
            updated.append(f"VITE_API_URL={new_api_url}\n")
            found = True
        else:
            updated.append(line)
    if not found:
        updated.append(f"VITE_API_URL={new_api_url}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(updated)
    print(f"  📝  {env_path}")
    print(f"      VITE_API_URL → {new_api_url}")


def find_ngrok_binary() -> str | None:
    """Return the path to the ngrok binary, or None if not found."""
    # 1) env-var override
    env_path = os.environ.get("NGROK_BIN")
    if env_path and os.path.isfile(env_path):
        return env_path

    # 2) system PATH
    system = shutil.which("ngrok") or shutil.which("ngrok.exe")
    if system:
        return system

    # 3) pyngrok default location
    try:
        from pyngrok import conf as pconf
        p = pconf.get_default().ngrok_path
        if p and os.path.isfile(p):
            return p
    except Exception:
        pass

    # 4) Common Windows locations
    candidates = [
        r"C:\Users\user\AppData\Local\ngrok\ngrok.exe",
        r"C:\Program Files\ngrok\ngrok.exe",
        r"C:\tools\ngrok\ngrok.exe",
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c

    return None


# ─────────────────────────────────────────────────────────────────────────────
# STRATEGY A:  use pyngrok (Python wrapper)
# ─────────────────────────────────────────────────────────────────────────────

def run_with_pyngrok(ngrok_bin: str) -> None:
    from pyngrok import ngrok, conf, exception

    pyngrok_config = conf.PyngrokConfig(ngrok_path=ngrok_bin)
    conf.set_default(pyngrok_config)
    ngrok.set_auth_token(AUTHTOKEN)

    print("  Starting tunnels via pyngrok…")
    try:
        backend_tunnel  = ngrok.connect(BACKEND_PORT,  proto="http", bind_tls=True)
        frontend_tunnel = ngrok.connect(FRONTEND_PORT, proto="http", bind_tls=True)
    except exception.PyngrokNgrokError as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)

    backend_url  = backend_tunnel.public_url
    frontend_url = frontend_tunnel.public_url

    print(f"\n  ✅  Backend  → {backend_url}")
    print(f"  ✅  Frontend → {frontend_url}")
    print(f"\n  🔍  Web inspector : http://127.0.0.1:4040\n")

    patch_frontend_env(FRONTEND_ENV, backend_url)

    print("\n  ⚠️  Restart npm run dev to pick up the new VITE_API_URL\n")
    print("  Tunnels LIVE. Press Ctrl+C to stop.\n")
    print("═" * 62)

    try:
        ngrok.get_ngrok_process().proc.wait()
    except KeyboardInterrupt:
        pass
    finally:
        print("\nShutting down…")
        ngrok.kill()
        patch_frontend_env(FRONTEND_ENV, "http://localhost:8000")
        print("Restored VITE_API_URL → http://localhost:8000")


# ─────────────────────────────────────────────────────────────────────────────
# STRATEGY B:  launch ngrok directly via subprocess + YAML config
# ─────────────────────────────────────────────────────────────────────────────

def get_tunnel_urls_from_api(max_wait: int = 15) -> tuple[str, str]:
    """Poll ngrok's local API until tunnels are available."""
    import urllib.request, json
    deadline = time.time() + max_wait
    while time.time() < deadline:
        try:
            with urllib.request.urlopen("http://localhost:4040/api/tunnels", timeout=2) as r:
                data = json.loads(r.read())
            tunnels = data.get("tunnels", [])
            backend_url = frontend_url = ""
            for t in tunnels:
                addr = t.get("config", {}).get("addr", "")
                pub  = t.get("public_url", "")
                if not pub.startswith("https"):
                    continue
                if str(BACKEND_PORT)  in addr:
                    backend_url  = pub
                if str(FRONTEND_PORT) in addr:
                    frontend_url = pub
            if backend_url and frontend_url:
                return backend_url, frontend_url
        except Exception:
            pass
        time.sleep(1)
    return "", ""


def run_with_subprocess(ngrok_bin: str) -> None:
    import urllib.request, json

    # Ensure authtoken is in config
    subprocess.run(
        [ngrok_bin, "config", "add-authtoken", AUTHTOKEN],
        capture_output=True, text=True
    )

    print("  Starting tunnels via subprocess + ngrok.yml…")
    proc = subprocess.Popen(
        [ngrok_bin, "start", "--all", "--config", NGROK_YML],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    # Stream ngrok output in background thread
    def stream(p):
        for line in p.stdout:
            pass  # suppress stdout noise; tunnels are read from API

    t = threading.Thread(target=stream, args=(proc,), daemon=True)
    t.start()

    print("  Waiting for tunnels to come online…")
    backend_url, frontend_url = get_tunnel_urls_from_api(max_wait=20)

    if not backend_url or not frontend_url:
        print("[ERROR] Tunnels failed to start. Check ngrok.yml or your authtoken.")
        proc.terminate()
        sys.exit(1)

    print(f"\n  ✅  Backend  → {backend_url}")
    print(f"  ✅  Frontend → {frontend_url}")
    print(f"\n  🔍  Web inspector : http://127.0.0.1:4040\n")

    patch_frontend_env(FRONTEND_ENV, backend_url)

    print("\n  ⚠️  Restart npm run dev to pick up the new VITE_API_URL\n")
    print("  Tunnels LIVE. Press Ctrl+C to stop.\n")
    print("═" * 62)

    try:
        proc.wait()
    except KeyboardInterrupt:
        pass
    finally:
        print("\nShutting down…")
        proc.terminate()
        patch_frontend_env(FRONTEND_ENV, "http://localhost:8000")
        print("Restored VITE_API_URL → http://localhost:8000")


# ─────────────────────────────────────────────────────────────────────────────
# Entrypoint
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    print(BANNER)

    ngrok_bin = find_ngrok_binary()

    if ngrok_bin:
        print(f"  Found ngrok binary: {ngrok_bin}\n")
    else:
        print("  [ERROR] ngrok binary not found!\n")
        print("  Install ngrok from the Microsoft Store:")
        print("    ms-windows-store://pdp/?ProductId=9mvs1j51gmk6")
        print("  Or open: https://apps.microsoft.com/store/detail/ngrok/9mvs1j51gmk6\n")
        print("  After installing, re-run:  python ngrok_tunnel.py\n")
        print("  Alternatively, set the NGROK_BIN environment variable:")
        print('    $env:NGROK_BIN = "C:\\path\\to\\ngrok.exe"')
        sys.exit(1)

    # Prefer pyngrok (nicer API), fall back to raw subprocess
    try:
        import pyngrok  # type: ignore
        run_with_pyngrok(ngrok_bin)
    except ImportError:
        run_with_subprocess(ngrok_bin)


if __name__ == "__main__":
    main()
