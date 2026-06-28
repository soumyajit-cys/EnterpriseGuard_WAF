from prometheus_client import (
    Counter
)

REQUEST_COUNTER = Counter(
    "waf_requests_total",
    "Total Requests"
)

BLOCK_COUNTER = Counter(
    "waf_blocked_total",
    "Blocked Requests"
)

