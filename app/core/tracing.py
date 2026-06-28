from opentelemetry import trace

tracer = trace.get_tracer(
    "enterprise-waf"
)