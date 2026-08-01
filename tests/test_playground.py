"""Tests for the /waf/test playground scoring pipeline (offline)."""

import base64

import pytest

from app.waf.actions import should_block
from app.waf.detector import Detector
from app.waf.engine import get_severity


async def run_playground(request) -> dict:
    """Replicates the exact logic of POST /waf/test in app/api/routes/waf.py."""
    detector = Detector()
    findings = await detector.detect(request)
    max_score = max((f["score"] for f in findings), default=0)
    total_score = sum(f["score"] for f in findings)
    effective_score = min(max_score + (total_score - max_score) // 2, 100)
    return {
        "findings": findings,
        "effective_score": effective_score,
        "severity": get_severity(effective_score),
        "verdict": "BLOCK" if should_block(effective_score) else "ALLOW",
    }


class TestPlaygroundPipeline:
    @pytest.mark.asyncio
    async def test_sqli_payload_flagged(self, playground_request_factory):
        result = await run_playground(
            playground_request_factory(
                input_value="' OR 1=1 --", source="query"
            )
        )
        types = {f["type"] for f in result["findings"]}
        assert "SQL_INJECTION" in types
        assert result["severity"] in {"medium", "high", "critical"}

    @pytest.mark.asyncio
    async def test_base64_sqli_flagged(self, playground_request_factory):
        token = base64.b64encode(b"' UNION SELECT * FROM users --").decode()
        result = await run_playground(
            playground_request_factory(input_value=token, source="query")
        )
        types = {f["type"] for f in result["findings"]}
        assert "SQL_INJECTION_ENCODED" in types
        assert result["effective_score"] > 0

    @pytest.mark.asyncio
    async def test_benign_input_allowed(self, playground_request_factory):
        result = await run_playground(
            playground_request_factory(
                input_value="hello world", source="query"
            )
        )
        assert result["findings"] == []
        assert result["effective_score"] == 0
        assert result["verdict"] == "ALLOW"
        assert result["severity"] == "low"

    @pytest.mark.asyncio
    async def test_smuggling_headers_flagged(self, playground_request_factory):
        result = await run_playground(
            playground_request_factory(
                input_value="",
                source="query",
                headers={"content-length": "5", "transfer-encoding": "chunked"},
            )
        )
        types = {f["type"] for f in result["findings"]}
        assert "HTTP_SMUGGLING" in types
        assert result["severity"] == "critical"
        assert result["verdict"] == "BLOCK"

    @pytest.mark.asyncio
    async def test_graphql_body_flagged(self, playground_request_factory):
        result = await run_playground(
            playground_request_factory(
                body='{"query":"{ __schema { types { name } } }"}',
            )
        )
        types = {f["type"] for f in result["findings"]}
        assert "GRAPHQL_ABUSE" in types

    @pytest.mark.asyncio
    async def test_graphql_fallback_to_query(self, playground_request_factory):
        result = await run_playground(
            playground_request_factory(
                input_value="query={ __schema { types { name } } }",
                source="query",
            )
        )
        types = {f["type"] for f in result["findings"]}
        assert "GRAPHQL_ABUSE" in types

    @pytest.mark.asyncio
    async def test_malicious_upload_flagged(self, playground_request_factory):
        body = (
            '--b\r\nContent-Disposition: form-data; name="f"; '
            'filename="shell.php"\r\n\r\n<?php echo 1;\r\n--b--'
        )
        result = await run_playground(playground_request_factory(body=body))
        types = {f["type"] for f in result["findings"]}
        assert "MALICIOUS_UPLOAD" in types

    @pytest.mark.asyncio
    async def test_command_injection_blocked(self, playground_request_factory):
        result = await run_playground(
            playground_request_factory(
                input_value="; rm -rf /", source="query"
            )
        )
        types = {f["type"] for f in result["findings"]}
        assert "COMMAND_INJECTION" in types
        assert result["verdict"] == "BLOCK"

    def test_score_never_exceeds_100(self):
        assert get_severity(100) == "critical"
