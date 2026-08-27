"""Cross-app helpers that belong to neither `account` nor `admin`.

A plain package rather than a Django app: it holds no models and needs no
migrations, and installing it as an app would only add a label to collide
with later.
"""
