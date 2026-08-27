"""Where uploaded documents physically live.

Files go to a dedicated Django storage alias, never the default one, so the
knowledge base's bucket cannot be written to by anything else and switching
to S3 is a settings change (see STORAGES in settings.py).

Three rules this module enforces:

  * The stored name is a UUID plus the detected extension. The uploader's
    filename is metadata on the row, never a path component — it is
    attacker-controlled and is how directory traversal, overwrites of other
    documents, and `.php` served by a misconfigured web server all happen.
  * The storage root is outside anything the web server serves. Nothing
    hands out a URL to it, and the storage alias is configured with no
    base_url so a mistake in that direction fails loudly.
  * The file is written and read as bytes. It is never executed, rendered,
    or handed to a shell.
"""

import hashlib
import logging
import uuid
from dataclasses import dataclass

from django.conf import settings
from django.core.files.storage import storages
from django.utils import timezone

logger = logging.getLogger('jaaz.knowledge_base')

# Read size for hashing and copying. Bounded so a 20MB upload does not become
# 20MB of peak memory on top of whatever Django already buffered.
_READ_CHUNK = 64 * 1024


@dataclass(frozen=True)
class StoredFile:
    storage_key: str
    size: int
    checksum: str


class DocumentStorageService:
    """Reads and writes document bytes. Knows nothing about processing."""

    def __init__(self, storage=None):
        self._storage = storage or storages[settings.KNOWLEDGE_BASE_STORAGE_ALIAS]

    def save(self, file_obj, *, kind) -> StoredFile:
        """Persist an upload and return its key, size and checksum.

        The checksum is computed from what was actually written, not from
        what the client said it was sending.
        """
        key = self._build_key(kind)

        file_obj.seek(0)
        written_key = self._storage.save(key, file_obj)

        digest = hashlib.sha256()
        size = 0
        with self._storage.open(written_key, 'rb') as stored:
            while True:
                block = stored.read(_READ_CHUNK)
                if not block:
                    break
                digest.update(block)
                size += len(block)

        logger.info(
            'Stored document bytes key=%s size=%s kind=%s', written_key, size, kind.key
        )
        return StoredFile(
            storage_key=written_key, size=size, checksum=digest.hexdigest()
        )

    def open(self, storage_key):
        """Open a stored document for reading. Caller closes it."""
        return self._storage.open(storage_key, 'rb')

    def delete(self, storage_key):
        """Remove a stored document.

        Never raises. Deletion is called from the document-delete path and
        from upload rollback; a storage backend that has already lost the
        object must not turn "the record is gone" into a 500.
        """
        if not storage_key:
            return False
        try:
            self._storage.delete(storage_key)
            logger.info('Deleted document bytes key=%s', storage_key)
            return True
        except Exception:
            logger.exception('Failed to delete document bytes key=%s', storage_key)
            return False

    def exists(self, storage_key):
        try:
            return self._storage.exists(storage_key)
        except Exception:
            logger.exception('Storage existence check failed key=%s', storage_key)
            return False

    # -- internals ------------------------------------------------------

    @staticmethod
    def _build_key(kind):
        """`knowledge-base/YYYY/MM/<uuid><ext>`.

        Date-partitioned so a directory listing stays usable and a lifecycle
        rule can act on age. The extension is the *detected* one, not the
        uploaded one.
        """
        now = timezone.now()
        extension = kind.extensions[0]
        return f'knowledge-base/{now:%Y/%m}/{uuid.uuid4().hex}{extension}'
