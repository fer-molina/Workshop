export interface GeolocationModel {
  ip_address?: string
  query_status?: QueryStatus
  full_ip_address?: FullIpAddress[]
  geolocation_data?: GeolocationData
}

export interface QueryStatus {
  query_status_code: string
  query_status_description: string
}

export interface FullIpAddress {
  key: string
  value: string
}

export interface GeolocationData {
  region_code: string
  region_name: string
  country_name: string
  continent_code: string
  continent_name: string
  "country_code_fips10-4": string
  country_code_iso3166alpha2: string
  country_code_iso3166alpha3: string
  country_code_iso3166numeric: string
}
