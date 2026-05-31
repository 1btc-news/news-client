from collections import OrderedDict

class ArticleCache:
    def __init__(self, maxsize=200):
        self.cache = OrderedDict()
        self.maxsize = maxsize
    def get(self, key):
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]
        return None
    def set(self, key, val):
        self.cache[key] = val
        if len(self.cache) > self.maxsize:
            self.cache.popitem(last=False)