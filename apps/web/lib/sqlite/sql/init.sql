CREATE TABLE IF NOT EXISTS "atoms" (
  "id" INTEGER NOT NULL,
  "recordId" BLOB NOT NULL,
  "scopeId" BLOB NOT NULL,
  "objectId" BLOB NOT NULL,
  "attribute" TEXT NOT NULL,
  "value" BLOB,
  "hint" TEXT,
  PRIMARY KEY("id")
);
CREATE INDEX index_atoms_on_scopeid_objectid_attribute on "atoms"(scopeId, objectId, attribute);
CREATE INDEX index_atoms_on_recordid on "atoms"(recordId);
CREATE TABLE IF NOT EXISTS "blobs" (
  "id" INTEGER NOT NULL,
  "blobId" BLOB NOT NULL UNIQUE,
  "scopeId" BLOB NOT NULL,
  "localPath" TEXT,
  "serverURL" TEXT,
  "size" INTEGER NOT NULL,
  "ioDirection" INTEGER NOT NULL,
  "ioState" INTEGER NOT NULL,
  PRIMARY KEY("id")
);
CREATE INDEX index_blobs_on_scopeid_blobid on "blobs"(scopeId, blobId);
CREATE INDEX index_blobs_on_iodirection_iostate on "blobs"(ioDirection, ioState);
CREATE TABLE IF NOT EXISTS "meta" (
  "attribute" TEXT NOT NULL,
  "value" TEXT,
  UNIQUE("attribute")
);
CREATE TABLE IF NOT EXISTS "records" (
  "id" INTEGER NOT NULL,
  "recordId" BLOB NOT NULL UNIQUE,
  "packId" BLOB,
  "clock" BLOB NOT NULL,
  "deviceId" BLOB NOT NULL,
  "scopeId" BLOB NOT NULL,
  "type" INTEGER NOT NULL,
  "ioDirection" INTEGER NOT NULL,
  "ioState" INTEGER NOT NULL,
  PRIMARY KEY("id")
);
CREATE INDEX index_records_on_scopeid_type on "records"(scopeId, type);
CREATE INDEX index_records_on_recordid on "records"(recordId);
CREATE INDEX index_records_on_iodirection_iostate on "records"(ioDirection, ioState, clock);
CREATE INDEX index_records_on_clock on "records"(clock);
CREATE VIEW "vRecords" AS
SELECT "records".*,
  "objectId",
  "attribute",
  "ivalue",
  "dvalue",
  "svalue",
  "bvalue",
  "hint"
FROM "records"
  LEFT OUTER JOIN "atoms" ON (
    "records"."recordId" = "atoms"."recordId";