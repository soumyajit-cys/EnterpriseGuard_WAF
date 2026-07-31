class AllowList:

    ALLOWED_IPS = {
        "::1",
    }

    @classmethod
    def contains(cls, ip: str):

        return ip in cls.ALLOWED_IPS
    
    