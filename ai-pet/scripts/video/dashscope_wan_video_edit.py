#!/usr/bin/env python3
"""Run Alibaba Model Studio Wan video edit on a local video clip."""

from __future__ import annotations

import argparse
import json
import os
import time
import urllib.parse
import urllib.request
from http import HTTPStatus
from pathlib import Path
from typing import Any

import dashscope
from dashscope import VideoSynthesis


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


def get_api_key() -> str:
    for name in ("DASHSCOPE_API_KEY", "AI_PET_QWEN_API_KEY"):
        value = os.environ.get(name)
        if value:
            return value
    for env_path in (
        Path("/Users/rencan/ai-pet-system/ai-pet/.env.local"),
        Path("/Users/rencan/ai-pet-system/ai-pet/release-config/.env"),
    ):
        env_values = load_env_file(env_path)
        for name in ("DASHSCOPE_API_KEY", "AI_PET_QWEN_API_KEY"):
            value = env_values.get(name)
            if value:
                return value
    raise RuntimeError("DASHSCOPE_API_KEY or AI_PET_QWEN_API_KEY is required.")


def redact_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))


def response_to_map(response: Any) -> dict[str, Any]:
    if isinstance(response, dict):
        return dict(response)
    to_dict = getattr(response.__class__, "to_dict", None)
    if callable(to_dict):
        return response.to_dict()
    if hasattr(response, "__dict__"):
        return dict(response.__dict__)
    return {"value": str(response)}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--output-name", required=True)
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--model", default="wan2.7-videoedit")
    parser.add_argument("--resolution", default="1080P")
    parser.add_argument("--prompt-extend", action="store_true", default=True)
    parser.add_argument("--no-prompt-extend", dest="prompt_extend", action="store_false")
    parser.add_argument("--watermark", action="store_true", default=False)
    parser.add_argument("--poll-interval", type=int, default=10)
    parser.add_argument("--timeout-seconds", type=int, default=1800)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    api_key = get_api_key()
    dashscope.base_http_api_url = "https://dashscope.aliyuncs.com/api/v1"

    input_path = Path(args.input).resolve()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / args.output_name

    response = VideoSynthesis.async_call(
        api_key=api_key,
        model=args.model,
        media=[{"type": "video", "url": "file://" + str(input_path)}],
        prompt=args.prompt,
        resolution=args.resolution,
        prompt_extend=args.prompt_extend,
        watermark=args.watermark,
    )
    if response.status_code != HTTPStatus.OK:
        raise RuntimeError(
            f"submit failed: status={response.status_code} code={response.code} message={response.message}"
        )

    task_id = response.output.task_id
    print(json.dumps({"submitted": True, "model": args.model, "task_id": task_id}, ensure_ascii=False))

    deadline = time.time() + args.timeout_seconds
    last_status = None
    final_response = None
    while time.time() < deadline:
        status = VideoSynthesis.fetch(task=response, api_key=api_key)
        status_map = response_to_map(status)
        task_status = status_map.get("output", {}).get("task_status")
        if task_status != last_status:
            print(json.dumps({"task_id": task_id, "status": task_status}, ensure_ascii=False))
            last_status = task_status
        if task_status == "SUCCEEDED":
            final_response = status_map
            break
        if task_status in {"FAILED", "CANCELED", "UNKNOWN"}:
            raise RuntimeError(json.dumps(status_map, ensure_ascii=False))
        time.sleep(args.poll_interval)

    if final_response is None:
        raise TimeoutError(f"Timed out waiting for DashScope task {task_id}.")

    output = final_response.get("output", {})
    video_url = output.get("video_url") or output.get("url")
    if not video_url:
        raise RuntimeError(f"No video_url in response: {final_response}")

    urllib.request.urlretrieve(video_url, output_path)
    report = {
        "model": args.model,
        "task_id": task_id,
        "status": "SUCCEEDED",
        "resolution": args.resolution,
        "output_path": str(output_path),
        "video_url_redacted": redact_url(video_url),
    }
    (output_dir / f"{output_path.stem}.dashscope-job.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
