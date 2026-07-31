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
            ("BOT_TRAFFIC", BotDetector(), 20),
        ]
        self.hpp = HTTPParameterPollutionDetector()

    async def detect(self, request) -> list[dict]:
        findings = []

        body = ""
        try:
            body = await request.body()
            body = body.decode("utf-8", errors="ignore")
        except Exception:
            pass

        query_params = str(request.query_params)
        headers_str = str({k: v for k, v in request.headers.items() if k.lower() not in ("host", "origin", "referer")})
        uri = str(request.url.path)

        targets = [
            ("query", query_params),
            ("body", body),
            ("uri", uri),
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
                    })

        hpp_score = self.hpp.inspect_string(query_params)
        if hpp_score >= 30:
            findings.append({
                "type": "HTTP_PARAMETER_POLLUTION",
                "score": hpp_score,
                "source": "query",
            })

        seen = {}
        deduped = []
        for f in findings:
            key = f["type"]
            if key not in seen or f["score"] > seen[key]["score"]:
                seen[key] = f
        deduped = list(seen.values())

        return deduped
