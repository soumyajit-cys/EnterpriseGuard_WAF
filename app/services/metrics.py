from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

REQUESTS_TOTAL = Counter(
    "waf_requests_total",
    "Total requests inspected by the WAF",
    ["action", "attack_type"],
)

BLOCKS_TOTAL = Counter(
    "waf_blocks_total",
    "Requests blocked by the WAF",
    ["reason"],
)

ALERTS_TOTAL = Counter(
    "waf_alerts_total",
    "Security alerts generated",
    ["severity"],
)

RULES_MATCHED = Counter(
    "waf_rules_matched_total",
    "Detection rules matched",
    ["rule_id", "category"],
)

RUNTIME_SYNCS = Counter(
    "waf_runtime_syncs_total",
    "Runtime syncs from the database",
)

REQUEST_DURATION = Histogram(
    "waf_request_duration_seconds",
    "Latency of requests inspected by the WAF",
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
)

REDIS_DOWN = Counter(
    "waf_redis_unavailable_total",
    "Times Redis was detected down (fail-open)",
)


def metrics_response():
    from starlette.responses import Response

    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
