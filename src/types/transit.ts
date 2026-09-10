export type LiftyStatus = 'approved' | 'suspended' | 'rejected' | 'pending_review'
export type IdentificationStatus = 'pending_pickup' | 'issued' | 'revoked'
export type VehicleType = 'car' | 'moto'

export type IdentificationEvent = {
  id: string
  action: 'issued' | 'revoked' | 'reissued'
  at: string
  byUserId: string
  byName: string
  batch?: string
  notes?: string
}

export type TransitDriver = {
  id: string
  fullName: string
  dniLast4: string
  phone?: string
  photoUrl?: string
  vehicle: {
    type: VehicleType
    plate: string
    brand?: string
    model?: string
    color?: string
  }
  liftyStatus: LiftyStatus
  identificationStatus: IdentificationStatus
  issuedAt?: string
  districtId: string
  districtName: string
  documentLinks?: { label: string; url: string }[]
  history: IdentificationEvent[]
}

export type TransitStats = {
  totalDrivers: number
  pendingPickup: number
  issuedThisMonth: number
  suspended: number
}

export type MarkIssuedPayload = {
  batch?: string
  notes?: string
}

export type RevokePayload = {
  notes?: string
}

export type DriversQuery = {
  q?: string
  liftyStatus?: LiftyStatus
  identificationStatus?: IdentificationStatus
  page?: number
  pageSize?: number
}

export type DriversListResponse = {
  data: TransitDriver[]
  meta: { total: number; page: number; pageSize: number }
}
