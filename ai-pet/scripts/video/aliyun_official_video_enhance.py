#!/usr/bin/env python3
"""Run Alibaba Cloud official VIAPI video enhancement on a local video file."""

from __future__ import annotations

import argparse
import configparser
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

from alibabacloud_tea_openapi.models import Config
from alibabacloud_tea_util.models import RuntimeOptions
from alibabacloud_videoenhan20200320.client import Client as VideoEnhanceClient
from alibabacloud_videoenhan20200320.models import (
    EnhanceVideoQualityAdvanceRequest,
    SuperResolveVideoAdvanceRequest,
)
from alibabacloud_viapi20230117.client import Client as ViapiClient
from alibabacloud_viapi20230117.models import GetAsyncJobResultRequest


def load_alibaba_credentials() -> tuple[str, str]:
    access_key_id = os.environ.get("ALIBABA_CLOUD_ACCESS_KEY_ID")
    access_key_secret = os.environ.get("ALIBABA_CLOUD_ACCESS_KEY_SECRET")
    if access_key_id and access_key_secret:
        return access_key_id, access_key_secret

    credentials_path = Path.home() / ".alibabacloud" / "credentials"
    parser = configparser.ConfigParser()
    if credentials_path.exists():
        parser.read(credentials_path)
        profile_name = os.environ.get("ALIBABA_CLOUD_PROFILE", "default")
        if parser.has_section(profile_name):
            section = parser[profile_name]
            access_key_id = section.get("access_key_id")
            access_key_secret = section.get("access_key_secret")
            if access_key_id and access_key_secret:
                return access_key_id, access_key_secret

    raise RuntimeError(
        "Alibaba Cloud credentials not found in env or ~/.alibabacloud/credentials."
    )


def create_video_client(access_key_id: str, access_key_secret: str) -> VideoEnhanceClient:
    return VideoEnhanceClient(
        Config(
            access_key_id=access_key_id,
            access_key_secret=access_key_secret,
            endpoint="videoenhan.cn-shanghai.aliyuncs.com",
            region_id="cn-shanghai",
        )
    )


def create_viapi_client(access_key_id: str, access_key_secret: str) -> ViapiClient:
    return ViapiClient(
        Config(
            access_key_id=access_key_id,
            access_key_secret=access_key_secret,
            endpoint="viapi.cn-shanghai.aliyuncs.com",
            region_id="cn-shanghai",
        )
    )


def body_to_map(body: Any) -> dict[str, Any]:
    if hasattr(body, "to_map"):
        return body.to_map()
    if isinstance(body, dict):
        return body
    return {"value": str(body)}


def redact_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))


def extract_result_video_url(result_text: str) -> str:
    try:
        result = json.loads(result_text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Async result is not valid JSON: {result_text[:200]}") from exc

    for key in ("VideoURL", "VideoUrl", "videoURL", "videoUrl"):
        value = result.get(key)
        if isinstance(value, str) and value:
            return value
    raise RuntimeError(f"Async result does not contain a video URL: {result}")


def submit_job(args: argparse.Namespace, client: VideoEnhanceClient) -> str:
    runtime = RuntimeOptions()
    with open(args.input, "rb") as video_file:
        if args.mode == "enhance":
            request = EnhanceVideoQualityAdvanceRequest(
                video_urlobject=video_file,
                out_put_width=args.width,
                out_put_height=args.height,
                frame_rate=args.frame_rate,
                hdrformat=args.hdr_format,
                max_illuminance=args.max_illuminance,
                bitrate=args.bitrate,
            )
            response = client.enhance_video_quality_advance(request, runtime)
        else:
            request = SuperResolveVideoAdvanceRequest(
                video_url_object=video_file,
                bit_rate=args.superres_bit_rate,
            )
            response = client.super_resolve_video_advance(request, runtime)

    response_map = body_to_map(response.body)
    job_id = response_map.get("RequestId") or response_map.get("requestId")
    if not job_id:
        raise RuntimeError(f"Submit response does not contain RequestId: {response_map}")
    print(json.dumps({"submitted": True, "mode": args.mode, "job_id": job_id}, ensure_ascii=False))
    return job_id


def poll_and_download(args: argparse.Namespace, client: ViapiClient, job_id: str) -> dict[str, Any]:
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / args.output_name
    runtime = RuntimeOptions()
    deadline = time.time() + args.timeout_seconds
    last_status = None

    while time.time() < deadline:
        response = client.get_async_job_result_with_options(
            GetAsyncJobResultRequest(job_id=job_id),
            runtime,
        )
        data = getattr(response.body, "data", None)
        data_map = body_to_map(data)
        status = data_map.get("Status") or data_map.get("status")
        if status != last_status:
            print(json.dumps({"job_id": job_id, "status": status}, ensure_ascii=False))
            last_status = status

        if status == "PROCESS_SUCCESS":
            result_text = data_map.get("Result") or data_map.get("result") or ""
            result_url = extract_result_video_url(result_text)
            urllib.request.urlretrieve(result_url, output_path)
            report = {
                "mode": args.mode,
                "job_id": job_id,
                "status": status,
                "output_path": str(output_path),
                "result_url_redacted": redact_url(result_url),
            }
            report_path = output_dir / f"{Path(args.output_name).stem}.aliyun-job.json"
            report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
            print(json.dumps(report, ensure_ascii=False))
            return report

        if status and status.endswith("FAILED"):
            error_code = data_map.get("ErrorCode") or data_map.get("errorCode")
            error_message = data_map.get("ErrorMessage") or data_map.get("errorMessage")
            raise RuntimeError(
                f"Alibaba async job failed: status={status} code={error_code} message={error_message}"
            )

        time.sleep(args.poll_interval)

    raise TimeoutError(f"Timed out waiting for Alibaba async job {job_id}.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--output-name", required=True)
    parser.add_argument("--mode", choices=["enhance", "superres"], default="enhance")
    parser.add_argument("--width", type=int, default=3840)
    parser.add_argument("--height", type=int, default=2176)
    parser.add_argument("--frame-rate", type=int, default=50)
    parser.add_argument("--hdr-format", default="PQ")
    parser.add_argument("--max-illuminance", type=int, default=600)
    parser.add_argument("--bitrate", type=int, default=200)
    parser.add_argument("--superres-bit-rate", type=int, default=20)
    parser.add_argument("--poll-interval", type=int, default=10)
    parser.add_argument("--timeout-seconds", type=int, default=1800)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    access_key_id, access_key_secret = load_alibaba_credentials()
    video_client = create_video_client(access_key_id, access_key_secret)
    viapi_client = create_viapi_client(access_key_id, access_key_secret)
    job_id = submit_job(args, video_client)
    poll_and_download(args, viapi_client, job_id)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        raise
