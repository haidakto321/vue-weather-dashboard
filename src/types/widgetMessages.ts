// Message contract for the main app <-> default-location-widget iframe boundary.
// The widget project (widgets/default-location-widget/) mirrors these shapes locally
// rather than importing them - the two projects intentionally don't share code.

export interface SavedCityLite {
  key: string
  name: string
  latitude: number
  longitude: number
  admin1?: string
  country?: string
}

export interface WidgetReadyMessage {
  type: 'widget:ready'
}

export interface WidgetSetDefaultMessage {
  type: 'widget:set-default'
  cityKey: string
}

export type WidgetToParentMessage = WidgetReadyMessage | WidgetSetDefaultMessage

export interface WidgetInitMessage {
  type: 'widget:init'
  cities: SavedCityLite[]
  defaultCityKey: string | null
}
