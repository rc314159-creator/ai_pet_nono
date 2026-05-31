#!/usr/bin/env python3
"""Fetch an Alibaba VIAPI async video job and download the output when ready."""

from __future__ import annotations

import argparse
import configparser
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

from alibabacloud_tea_openapi.models import Config
from alibabacloud_tea_util.models import RuntimeOptions
from alibabacloud_viapi20230117.client import Client
from alibabacloud_viapi20230117.models import GetAsyncJobResultRequest


def load_alibaba_credentials() -> tuple[str, str]:
    access_key_id = os.environ.get("ALIBABA_CLOUD_ACCESS_KEY_ID")
    access_key_secret = os.environ.get("ALIBABA_CLOUD_ACCESS_KEY_SECRET")
    if access_key_id and access_key_secret:
        return access_key_id, access_key_secret

    parser = configparser.ConfigParser()
    parser.read(Path.home() / ".alibabacloud" / "credentials")
    section = parser[os.environ.get("ALIBABA_CLOUD_PROFILE", "default")]
    return section["access_key_id"], section["access_key_secret"]


def body_to_map(body: Any) -> dict[str, Any]:
    if hasattr(body, "to_map"):
        return body.to_map()
    if isinstance(body, dict):
        return body
    return {"value": str(body)}


def redact_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))


def extract_video_url(result_text: str) -> str | None:
    if not result_text:
        return None
    result = json.loads(result_text)
    for key in ("videoUrl", "VideoURL", "VideoUrl", "videoURL", "url"):
        value = result.get(key)
        if isinstance(value, str) and value:
            return value
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--job-id", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    access_key_id, access_key_secret = load_alibaba_credentials()
    client = Client(
        Config(
            access_key_id=access_key_id,
            access_key_secret=access_key_secret,
            endpoint="viapi.cn-shanghai.aliyuncs.com",
            region_id="cn-shanghai",
        )
    )
    response = client.get_async_job_result_with_options(
        GetAsyncJobResultRequest(job_id=args.job_id),
        RuntimeOptions(),
    )
    data = body_to_map(response.body.data)
    status = data.get("Status") or data.get("status")
    report: dict[str, Any] = {
        "job_id": args.job_id,
        "status": status,
        "error_code": data.get("ErrorCode") or data.get("errorCode"),
        "error_message": data.get("ErrorMessage") or data.get("errorMessage"),
    }
    if status == "PROCESS_SUCCESS":
        url = extract_video_url(data.get("Result") or data.get("result") or "")
        if not url:
            raise RuntimeError(f"No video URL in result: {data}")
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(url, output)
        report["output_path"] = str(output)
        report["video_url_redacted"] = redact_url(url)
    print(json.dumps(report, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
