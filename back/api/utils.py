class classproperty[T]:
    """Utility descriptor for helping TY figure out class props"""

    def __init__(self, it: type[T] | None = None):
        del it
        pass

    def __set_name__(self, owner, name):
        del owner
        self.name = name

    def __get__(self, instance, cls) -> T:
        del instance
        return getattr(super(cls, cls), self.name)
