import re


class GraphQLDetector:
    """Detects GraphQL abuse: introspection disclosure, excessive query
    depth, alias bombing, and brute-force signatures in the query body."""

    def __init__(self):
        self._introspection = re.compile(
            r"(__schema|__type|__typename|__directive)",
            re.I,
        )
        self._alias = re.compile(r"\b\w+\s*:", re.I)
        self._operation = re.compile(r"\b(query|mutation|subscription)\b", re.I)

    def _max_depth(self, body: str) -> int:
        depth = 0
        max_depth = 0
        in_string = False
        escape = False
        for ch in body:
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
                continue
            if ch == '"':
                in_string = True
            elif ch == "{":
                depth += 1
                max_depth = max(max_depth, depth)
            elif ch == "}":
                depth = max(depth - 1, 0)
        return max_depth

    def inspect(self, source_value: str) -> int:
        score = 0

        if self._introspection.search(source_value):
            score = max(score, 80)

        if self._operation.search(source_value):
            depth = self._max_depth(source_value)
            if depth >= 12:
                score = max(score, 60)
            elif depth >= 8:
                score = max(score, 35)

            alias_count = len(self._alias.findall(source_value))
            if alias_count > 60:
                score = max(score, 70)

        return score
