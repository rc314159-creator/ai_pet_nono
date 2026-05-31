#!/usr/bin/env python3
"""Submit and download Yunwu VEO video generation tasks."""

from __future__ import annotations

import argparse
import base64
import json
import os
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

import requests


def load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def get_yunwu_key() -> str:
    for name in ("YUNWU_VIDEO_API_KEY", "YUNWU_API_KEY", "OPENAI_API_KEY"):
        value = os.environ.get(name)
        if value:
            return value
    secret_values = load_env_file(Path("/Users/rencan/.codex/secrets/ai-pet-video.env"))
    for name in ("YUNWU_VIDEO_API_KEY", "YUNWU_API_KEY"):
        value = secret_values.get(name)
        if value:
            return value
    raise RuntimeError("YUNWU_VIDEO_API_KEY is required.")


def data_uri(path: Path) -> str:
    suffix = path.suffix.lower()
    mime = "image/png" if suffix == ".png" else "image/jpeg"
    payload = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{payload}"


def redact_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))


def extract_task_id(data: dict[str, Any]) -> str:
    for key in ("task_id", "id", "video_id"):
        value = data.get(key)
        if isinstance(value, str) and value:
            return value
    raise RuntimeError(f"No task id in response: {data}")


def extract_video_url(data: dict[str, Any]) -> str | None:
    for key in ("video_url", "url", "result_url"):
        value = data.get(key)
        if isinstance(value, str) and value:
            return value
    output = data.get("output")
    if isinstance(output, dict):
        for key in ("video_url", "url", "result_url"):
            value = output.get(key)
            if isinstance(value, str) and value:
                return value
    return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--output-name", required=True)
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--model", default="veo3.1-pro-4k")
    parser.add_argument("--size", default="3840x2160")
    parser.add_argument("--image", action="append", default=[])
    parser.add_argument("--poll-interval", type=int, default=15)
    parser.add_argument("--timeout-seconds", type=int, default=3600)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    key = get_yunwu_key()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / args.output_name

    images = [data_uri(Path(path).resolve()) for path in args.image]
    payload: dict[str, Any] = {
        "model": args.model,
        "prompt": args.prompt,
        "size": args.size,
    }
    if images:
        payload["images"] = images

    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    response = requests.post(
        "https://yunwu.ai/v1/videos",
        headers=headers,
        json=payload,
        timeout=60,
    )
    if response.status_code >= 400:
        raise RuntimeError(f"submit failed {response.status_code}: {response.text[:1000]}")
    submit_data = response.json()
    task_id = extract_task_id(submit_data)
    print(json.dumps({"submitted": True, "model": args.model, "task_id": task_id}, ensure_ascii=False))

    deadline = time.time() + args.timeout_seconds
    last_status = None
    final_data: dict[str, Any] | None = None
    while time.time() < deadline:
        status_response = requests.get(
            f"https://yunwu.ai/v1/videos/{task_id}",
            headers={"Authorization": f"Bearer {key}"},
            timeout=60,
        )
        if status_response.status_code >= 400:
            raise RuntimeError(
                f"poll failed {status_response.status_code}: {status_response.text[:1000]}"
            )
        data = status_response.json()
        status = str(data.get("status") or data.get("state") or "").lower()
        if status != last_status:
            print(json.dumps({"task_id": task_id, "status": status}, ensure_ascii=False))
            last_status = status
        if status in {"completed", "succeeded", "success", "finished"} or extract_video_url(data):
            final_data = data
            break
        if status in {"failed", "error", "cancelled", "canceled"}:
            raise RuntimeError(json.dumps(data, ensure_ascii=False)[:2000])
        time.sleep(args.poll_interval)

    if final_data is None:
        raise TimeoutError(f"Timed out waiting for Yunwu VEO task {task_id}.")

    video_url = extract_video_url(final_data)
    if not video_url:
        raise RuntimeError(f"No video URL in final response: {final_data}")
    urllib.request.urlretrieve(video_url, output_path)

    report = {
        "model": args.model,
        "task_id": task_id,
        "status": final_data.get("status") or final_data.get("state"),
        "size": args.size,
        "output_path": str(output_path),
        "video_url_redacted": redact_url(video_url),
    }
    (output_dir / f"{output_path.stem}.yunwu-job.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
