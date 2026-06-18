def add_security_headers(response):

    response.headers["X-Frame-Options"] = "DENY"

    response.headers["X-Content-Type-Options"] = "nosniff"

    response.headers["Referrer-Policy"] = "strict-origin"

    response.headers["Content-Security-Policy"] = (
        "default-src 'self'"
    )

    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=()"
    )


    