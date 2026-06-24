class AllowList:

    ALLOWED_IPS = {
        "127.0.0.1"
    }

    @classmethod
    def contains(cls, ip: str):

        return ip in cls.ALLOWED_IPS
    
    