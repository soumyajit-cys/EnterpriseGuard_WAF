class BlockList:

    BLOCKED_IPS = set()

    @classmethod
    def contains(cls, ip: str):

        return ip in cls.BLOCKED_IPS

    @classmethod
    def add(cls, ip: str):

        cls.BLOCKED_IPS.add(ip)