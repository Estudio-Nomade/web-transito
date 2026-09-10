#!/usr/bin/env python3
"""One-shot: set VITE_SUPABASE_* on Vercel from local .env (build-time plain)."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
auth = json.loads(Path.home().joinpath(".local/share/com.vercel.cli/auth.json").read_text())
token = auth["token"]
proj = json.loads((ROOT / ".vercel/project.json").read_text())
project_id = proj.get("projectId") or proj.get("project", {}).get("id")
org_id = proj.get("orgId") or proj.get("org", {}).get("id")

env: dict[str, str] = {}
for line in (ROOT / ".env").read_text().splitlines():
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()


def api(method: str, path: str, body: dict | None = None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        "https://api.vercel.com" + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read().decode()
            return r.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            j = json.loads(raw)
        except Exception:
            j = {"raw": raw[:500]}
        return e.code, j


print("project_id", project_id, "org_id", org_id)
st, body = api("GET", f"/v9/projects/{project_id}/env?teamId={org_id}")
if st != 200:
    print("list_fail", st, body)
    sys.exit(1)

for e in body.get("envs", []):
    if e.get("key") in ("VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"):
        st_d, _ = api("DELETE", f"/v9/projects/{project_id}/env/{e['id']}?teamId={org_id}")
        print("del", e["key"], e.get("target"), st_d)

for key in ("VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"):
    st_a, d = api(
        "POST",
        f"/v10/projects/{project_id}/env?teamId={org_id}",
        {
            "key": key,
            "value": env[key],
            "type": "plain",
            "target": ["production", "preview", "development"],
        },
    )
    print("add", key, st_a, d.get("error") or "ok", "value_len", len(env[key]))

st, body = api("GET", f"/v9/projects/{project_id}/env?teamId={org_id}")
for e in body.get("envs", []):
    if e.get("key", "").startswith("VITE_SUPABASE"):
        st2, one = api("GET", f"/v1/projects/{project_id}/env/{e['id']}?teamId={org_id}")
        val = one.get("value") or ""
        print(
            "verify",
            e["key"],
            e.get("target"),
            "len",
            len(val),
            "prefix",
            val[:28] if val else None,
        )
print("API_ENV_OK")
