import base64

import pytest

from app.waf.detector import Detector
from app.waf.rules.encoded import decode_candidates
from app.waf.rules.graphql import GraphQLDetector
from app.waf.rules.smuggling import HTTPRequestSmugglingDetector
from app.waf.rules.upload import FileUploadDetector


class TestHTTPRequestSmuggling:
    def test_cl_te_conflict_scores_90(self):
        headers = {"content-length": "5", "transfer-encoding": "chunked"}
        assert HTTPRequestSmugglingDetector().inspect_headers(headers) == 90

    def test_duplicate_content_length_scores_85(self):
        headers = {"content-length": "5", "Content-Length": "7"}
        assert HTTPRequestSmugglingDetector().inspect_headers(headers) == 85

    def test_duplicate_transfer_encoding_scores_90(self):
        headers = {
            "transfer-encoding": "chunked",
            "Transfer-Encoding": "chunked",
        }
        assert HTTPRequestSmugglingDetector().inspect_headers(headers) == 90

    def test_te_identity_scores_80(self):
        headers = {"transfer-encoding": "identity"}
        assert HTTPRequestSmugglingDetector().inspect_headers(headers) == 80

    def test_clean_request_scores_zero(self):
        headers = {"content-length": "5", "user-agent": "curl/8.0"}
        assert HTTPRequestSmugglingDetector().inspect_headers(headers) == 0

    def test_empty_headers_scores_zero(self):
        assert HTTPRequestSmugglingDetector().inspect_headers({}) == 0


class TestGraphQL:
    def test_introspection_scores_80(self):
        assert GraphQLDetector().inspect("{ __schema { types { name } } }") == 80

    def test_type_typename_queries_flagged(self):
        assert GraphQLDetector().inspect("query { __typename }") >= 80

    def test_deep_nesting_scores_60(self):
        deep = "query { " + "a{".join("" for _ in range(14)) + "x" + "}" * 14
        assert GraphQLDetector().inspect(deep) == 60

    def test_moderate_nesting_scores_35(self):
        deep = "query { " + "a{".join("" for _ in range(10)) + "x" + "}" * 10
        assert GraphQLDetector().inspect(deep) == 35

    def test_alias_bomb_scores_70(self):
        aliases = " ".join(f"a{i}:field" for i in range(70))
        assert GraphQLDetector().inspect(f"query {{ {aliases} }}") == 70

    def test_benign_query_scores_zero(self):
        assert GraphQLDetector().inspect("query { user(id: 1) { name } }") == 0


class TestFileUpload:
    def test_php_filename_scores_70(self):
        body = 'Content-Disposition: form-data; name="file"; filename="shell.php"'
        assert FileUploadDetector().inspect(body) == 70

    def test_double_extension_scores_75(self):
        body = 'filename="shell.php.jpg"'
        assert FileUploadDetector().inspect(body) == 75

    def test_php_marker_escalates_to_90(self):
        body = 'filename="shell.php" content: <?php system($_GET["c"]); ?>'
        assert FileUploadDetector().inspect(body) == 90

    def test_shebang_scores_90(self):
        body = 'filename="run.sh"\r\n#!/bin/bash id'
        assert FileUploadDetector().inspect(body) == 90

    def test_benign_upload_scores_zero(self):
        body = 'Content-Disposition: form-data; name="file"; filename="photo.jpg"'
        assert FileUploadDetector().inspect(body) == 0

    def test_non_multipart_body_scores_zero(self):
        assert FileUploadDetector().inspect("just a plain body") == 0


class TestDecodeCandidates:
    def test_base64_token_decoded(self):
        token = base64.b64encode(b"1' OR '1'='1").decode()
        candidates = decode_candidates(f"token={token}")
        kinds = {c["kind"]: c["value"] for c in candidates}
        assert "base64" in kinds
        assert "1' OR '1'='1" in kinds["base64"]

    def test_hex_token_decoded(self):
        hexed = "3b756e696f6e2073656c656374"
        candidates = decode_candidates(hexed)
        kinds = {c["kind"]: c["value"] for c in candidates}
        assert "hex" in kinds
        assert kinds["hex"] == ";union select"

    def test_original_not_returned_when_equals_input(self):
        assert decode_candidates("hello world") == []

    def test_empty_string_returns_nothing(self):
        assert decode_candidates("") == []

    def test_plain_text_not_decoded(self):
        assert decode_candidates("nothing suspicious here") == []


class TestDetectorIntegration:
    @pytest.mark.asyncio
    async def test_sqli_in_query_detected(self, request_factory):
        req = request_factory(query="id=1 UNION SELECT username FROM users")
        findings = await Detector().detect(req)
        types = {f["type"] for f in findings}
        assert "SQL_INJECTION" in types

    @pytest.mark.asyncio
    async def test_encoded_sqli_detected(self, request_factory):
        token = base64.b64encode(b"1' OR '1'='1 --").decode()
        req = request_factory(query=f"token={token}")
        findings = await Detector().detect(req)
        types = {f["type"] for f in findings}
        assert "SQL_INJECTION_ENCODED" in types

    @pytest.mark.asyncio
    async def test_smuggling_detected(self, request_factory):
        req = request_factory(
            headers={"content-length": "5", "transfer-encoding": "chunked"}
        )
        findings = await Detector().detect(req)
        types = {f["type"] for f in findings}
        assert "HTTP_SMUGGLING" in types

    @pytest.mark.asyncio
    async def test_graphql_introspection_detected(self, request_factory):
        req = request_factory(body='{"query": "{ __schema { types { name } } }"}')
        findings = await Detector().detect(req)
        types = {f["type"] for f in findings}
        assert "GRAPHQL_ABUSE" in types

    @pytest.mark.asyncio
    async def test_malicious_upload_detected(self, request_factory):
        body = (
            '--boundary\r\nContent-Disposition: form-data; name="file"; '
            'filename="shell.php"\r\n\r\n<?php echo 1;\r\n--boundary--'
        )
        req = request_factory(body=body)
        findings = await Detector().detect(req)
        types = {f["type"] for f in findings}
        assert "MALICIOUS_UPLOAD" in types

    @pytest.mark.asyncio
    async def test_benign_request_clean(self, request_factory):
        req = request_factory(
            query="q=hello+world", body="name=alice", path="/search"
        )
        findings = await Detector().detect(req)
        assert findings == []

    @pytest.mark.asyncio
    async def test_findings_deduped_by_type(self, request_factory):
        req = request_factory(query="id=1' OR '1'='1' -- AND x=1")
        findings = await Detector().detect(req)
        types = [f["type"] for f in findings]
        assert len(types) == len(set(types))
