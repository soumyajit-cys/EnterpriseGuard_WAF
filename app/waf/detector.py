from app.waf.rules.sqli import SQLInjectionDetector
from app.waf.rules.xss import XSSDetector
from app.waf.rules.bot import BotDetector
from app.waf.rules.command_injection import CommandInjectionDetector
from app.waf.rules.path_traversal import PathTraversalDetector
from app.waf.rules.lfi import LFIDetector
from app.waf.rules.rfi import RFIDetector
from app.waf.rules.xxe import XXEDetector
from app.waf.rules.ssrf import SSRFDetector
from app.waf.rules.ssti import SSTIDetector
from app.waf.rules.ldap_injection import LDAPInjectionDetector
from app.waf.rules.header_injection import HeaderInjectionDetector
from app.waf.rules.hpp import HTTPParameterPollutionDetector
from app.waf.rules.smuggling import HTTPRequestSmugglingDetector
from app.waf.rules.graphql import GraphQLDetector
from app.waf.rules.upload import FileUploadDetector
from app.waf.rules.encoded import decode_candidates
from app.services.runtime_sync import custom_rules


def _evidence(value: str | None, max_len: int = 120) -> str:
    """Truncated snippet of the input that triggered a finding."""
    if not value:
        return ""
    return " ".join(str(value).split())[:max_len]


class Detector:

    def __init__(self):
        self.detectors = [
            ("SQL_INJECTION", SQLInjectionDetector(), 30),
            ("XSS", XSSDetector(), 25),
            ("COMMAND_INJECTION", CommandInjectionDetector(), 85),
            ("PATH_TRAVERSAL", PathTraversalDetector(), 40),
            ("LFI", LFIDetector(), 70),
            ("RFI", RFIDetector(), 85),
            ("XXE", XXEDetector(), 80),
            ("SSRF", SSRFDetector(), 75),
            ("SSTI", SSTIDetector(), 50),
            ("LDAP_INJECTION", LDAPInjectionDetector(), 40),
            ("HEADER_INJECTION", HeaderInjectionDetector(), 80),
        ]
        self.bot = BotDetector()
        self.hpp = HTTPParameterPollutionDetector()
        self.smuggling = HTTPRequestSmugglingDetector()
        self.graphql = GraphQLDetector()
        self.upload = FileUploadDetector()

    async def detect(self, request) -> list[dict]:
        findings = []

        from urllib.parse import unquote

        body = ""
        try:
            body = await request.body()
            body = body.decode("utf-8", errors="ignore")
        except Exception:
            pass

        query_params = str(request.query_params)
        _header_exclusions = (
            "host",
            "origin",
            "referer",
            "x-forwarded-for",
            "x-real-ip",
            "forwarded",
            "cf-connecting-ip",
            "true-client-ip",
            "x-client-ip",
        )
        headers_str = str({k: v for k, v in request.headers.items() if k.lower() not in _header_exclusions})
        uri = str(request.url.path)

        query_plain = unquote(query_params.replace("+", " "))
        body_plain = unquote(body)

        targets = [
            ("query", query_params),
            ("query_decoded", query_plain),
            ("body", body),
            ("body_decoded", body_plain),
            ("uri", uri),
            ("uri_decoded", unquote(uri)),
            ("headers", headers_str),
            ("cookies", str(request.cookies)),
        ]

        for attack_type, detector, threshold in self.detectors:
            for source_name, source_value in targets:
                score = 0
                if hasattr(detector, "inspect"):
                    score = detector.inspect(source_value)
                if score >= threshold:
                    findings.append({
                        "type": attack_type,
                        "score": score,
                        "source": source_name,
                        "evidence": _evidence(source_value),
                    })

        smuggling_score = self.smuggling.inspect_headers(request.headers)
        if smuggling_score >= 80:
            findings.append({
                "type": "HTTP_SMUGGLING",
                "score": smuggling_score,
                "source": "headers",
                "evidence": _evidence(str({k: v for k, v in request.headers.items() if k.lower() in ("content-length", "transfer-encoding")})),
            })

        graphql_score = self.graphql.inspect(body)
        if graphql_score < 35:
            graphql_score = self.graphql.inspect(query_params)
        if graphql_score >= 35:
            findings.append({
                "type": "GRAPHQL_ABUSE",
                "score": graphql_score,
                "source": "body" if body else "query",
                "evidence": _evidence(body or query_params),
            })

        upload_score = self.upload.inspect(body)
        if upload_score >= 70:
            findings.append({
                "type": "MALICIOUS_UPLOAD",
                "score": upload_score,
                "source": "body",
                "evidence": _evidence(body),
            })

        for source_name, source_value in targets:
            for candidate in decode_candidates(source_value):
                for attack_type, detector, threshold in self.detectors:
                    if not hasattr(detector, "inspect"):
                        continue
                    try:
                        score = detector.inspect(candidate["value"])
                    except Exception:
                        continue
                    if score >= threshold:
                        findings.append({
                            "type": f"{attack_type}_ENCODED",
                            "score": min(score + 10, 100),
                            "source": f"{source_name}:{candidate['kind']}",
                            "evidence": _evidence(candidate["value"]),
                        })

        hpp_score = self.hpp.inspect_string(query_params)
        if hpp_score >= 30:
            findings.append({
                "type": "HTTP_PARAMETER_POLLUTION",
                "score": hpp_score,
                "source": "query",
                "evidence": _evidence(query_params),
            })

        bot_score = self.bot.inspect(request.headers.get("user-agent"))
        if bot_score >= 20:
            findings.append({
                "type": "BOT_TRAFFIC",
                "score": bot_score,
                "source": "user-agent",
                "evidence": _evidence(request.headers.get("user-agent")),
            })

        for source_name, source_value in targets:
            for hit in custom_rules.match(source_value):
                findings.append(hit)

        seen = {}
        deduped = []
        for f in findings:
            key = f["type"]
            if key not in seen or f["score"] > seen[key]["score"]:
                seen[key] = f
        deduped = list(seen.values())

        return deduped
