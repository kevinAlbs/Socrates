#!/usr/bin/env python
# -*- coding: utf-8 -*-

import urllib
import urlparse

def url_fix(s, charset='utf-8'):
    if isinstance(s, unicode):
        s = s.encode(charset, 'ignore')
    scheme, netloc, path, qs, anchor = urlparse.urlsplit(s)
    path = urllib.quote(path, '/%')
    qs = urllib.quote_plus(qs, ':&=')
    return urlparse.urlunsplit((scheme, netloc, path, qs, anchor))

#input = "http://de.wikipedia.org/wiki/Elf (Begriffsklärung)"
input = "http://www.rutgers.edu/Bäng/here and there/"
print input
print url_fix(input)
