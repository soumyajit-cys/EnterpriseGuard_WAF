"""Registry of the 16 built-in detectors compiled into the engine.

Each entry is the single source of truth for the detector's rule-like
metadata. Rows are seeded into the rules table per organization (marked
`is_builtin=True`) so their enabled state can be toggled and enforced by
the engine at runtime.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class BuiltinRuleMeta:
    name: str
    category: str
    description: str
    severity: str
    threshold: int


BUILTIN_RULES: list[BuiltinRuleMeta] = [
    BuiltinRuleMeta(
        name="SQL_INJECTION",
        category="injection",
        description="Classic SQLi payloads in params, headers and body",
        severity="medium",
        threshold=30,
    ),
    BuiltinRuleMeta(
        name="XSS",
        category="injection",
        description="Cross-site scripting payloads and event handlers",
        severity="medium",
        threshold=25,
    ),
    BuiltinRuleMeta(
        name="COMMAND_INJECTION",
        category="injection",
        description="OS command chaining and shell metacharacters",
        severity="critical",
        threshold=85,
    ),
    BuiltinRuleMeta(
        name="PATH_TRAVERSAL",
        category="injection",
        description="Directory traversal sequences (../, ..\\)",
        severity="medium",
        threshold=40,
    ),
    BuiltinRuleMeta(
        name="LFI",
        category="injection",
        description="Local file inclusion via wrappers and proc paths",
        severity="high",
        threshold=70,
    ),
    BuiltinRuleMeta(
        name="RFI",
        category="injection",
        description="Remote file inclusion and URL loaders",
        severity="critical",
        threshold=85,
    ),
    BuiltinRuleMeta(
        name="XXE",
        category="injection",
        description="XML external entity payloads",
        severity="critical",
        threshold=80,
    ),
    BuiltinRuleMeta(
        name="SSRF",
        category="injection",
        description="Server-side request forgery — internal/metadata targets",
        severity="high",
        threshold=75,
    ),
    BuiltinRuleMeta(
        name="SSTI",
        category="injection",
        description="Server-side template injection expressions",
        severity="high",
        threshold=50,
    ),
    BuiltinRuleMeta(
        name="LDAP_INJECTION",
        category="injection",
        description="LDAP filter injection operators",
        severity="medium",
        threshold=40,
    ),
    BuiltinRuleMeta(
        name="HEADER_INJECTION",
        category="injection",
        description="CRLF and response header splitting",
        severity="critical",
        threshold=80,
    ),
    BuiltinRuleMeta(
        name="HTTP_SMUGGLING",
        category="protocol",
        description="CL+TE / TE+CL conflicting transfer headers",
        severity="critical",
        threshold=80,
    ),
    BuiltinRuleMeta(
        name="GRAPHQL_ABUSE",
        category="protocol",
        description="Introspection queries and batching abuse",
        severity="high",
        threshold=35,
    ),
    BuiltinRuleMeta(
        name="MALICIOUS_UPLOAD",
        category="payload",
        description="Dangerous filenames and content in multipart uploads",
        severity="high",
        threshold=70,
    ),
    BuiltinRuleMeta(
        name="HTTP_PARAMETER_POLLUTION",
        category="protocol",
        description="Duplicate params smuggling intent past routing",
        severity="medium",
        threshold=30,
    ),
    BuiltinRuleMeta(
        name="BOT_TRAFFIC",
        category="bot",
        description="Known bot fingerprints in the user agent",
        severity="low",
        threshold=20,
    ),
]