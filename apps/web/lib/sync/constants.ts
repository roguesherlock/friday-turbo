export enum IO_TYPE {
  REQUEST = 0,
  RESPONSE,
}

export enum IO_DIRECTION {
  INBOUND = 0,
  OUTBOUND,
}

export enum IO_STATE {
  INITIAL = 0,
  SYNCING,
  SYNCED,
}

export interface SyncInterface {}
