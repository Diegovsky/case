from rest_framework.serializers import (
    LIST_SERIALIZER_KWARGS_REMOVE,
    LIST_SERIALIZER_KWARGS,
)
from rest_framework import serializers


class ReturnDict(dict):
    def __init__(self, *args, **kwargs):
        self.serializer = kwargs.pop("serializer")
        super().__init__(*args, **kwargs)

    def __repr__(self):
        return dict.__repr__(self)

    def __reduce__(self):
        # Pickling these objects will drop the .serializer backlink,
        # but preserve the raw data.
        return (dict, (dict(self),))


class HashIdDictSerializer(serializers.ListSerializer):
    @classmethod
    def many_init(cls, child_cls, *args, **kwargs):
        list_kwargs = {}
        for key in LIST_SERIALIZER_KWARGS_REMOVE:
            value = kwargs.pop(key, None)
            if value is not None:
                list_kwargs[key] = value
        list_kwargs["child"] = child_cls(*args, **kwargs)
        list_kwargs.update(
            {
                key: value
                for key, value in kwargs.items()
                if key in LIST_SERIALIZER_KWARGS
            }
        )
        return cls(*args, **list_kwargs)

    @property
    def data(self):
        data = super(serializers.ListSerializer, self).data
        return ReturnDict(data, serializer=self)

    def to_representation(self, data):
        iterable = super().to_representation(data)
        return {str(obj["hashid"]): obj for obj in iterable}
