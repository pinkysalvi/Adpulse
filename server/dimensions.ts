// The made-up ad marketplace: publishers, sub IDs, advertisers, campaigns...
// Each value has a traffic weight used to scale numbers when it is filtered on.

import type { FilterKey, Option } from './types'
import { randRange } from './random'

const PUBLISHERS = [
  'NewsHub Media', 'Daily Pulse', 'TechWire', 'Urban Eats', 'TravelNest', 'FitLife Today', 'GameZone',
  'FinanceFlow', 'StyleCircle', 'AutoTrack', 'HomeCraft', 'PetPal', 'MovieBuzz', 'EduSpark', 'GreenPlanet',
  'SportsArena', 'ParentHood', 'Bookworm Hub', 'MusicBeat', 'HealthFirst', 'CodeCraft', 'LocalLens',
  'ShopSmart', 'WeatherNow',
]
const TAGS = [
  'Display 300x250', 'Display 728x90', 'Native In-Feed', 'Video Pre-roll', 'Video Outstream', 'Search Ads',
  'Sticky Footer', 'Interstitial', 'Rewarded Video', 'Content Recs', 'Shopping Feed', 'Push Native',
  'Email Native', 'Header Bidding', 'App Banner', 'Audio Spot',
]
const BRANDS = [
  'Nimbus', 'Brightway', 'Coastline', 'Evergreen', 'Lumen', 'Northwind', 'Orbit', 'Pioneer', 'Quartz',
  'Summit', 'Velvet', 'Zephyr',
]
const ADVERTISERS = [
  'Acme Retail', 'BlueSky Travel', 'Crest Finance', 'Delta Motors', 'Echo Electronics', 'Fresh Grocer',
  'Globe Telecom', 'Harbor Insurance', 'Iris Beauty', 'Jet Streaming',
]
const CAMPAIGNS = [
  'Black Friday Deals', 'Summer Escape', 'Back to School', 'Holiday Gifts', 'Spring Refresh', 'New Year Fitness',
  'Cyber Monday', 'Loyalty Rewards', 'App Install Push', 'Brand Awareness Q4', 'Retargeting Always-on',
  'Free Trial Promo', 'Clearance Sale', 'Weekend Flash Sale', 'Premium Upgrade', 'Valentine Picks',
  'Travel Insurance', 'Streaming Launch',
]
const COUNTRIES = [
  ['US', 'United States'], ['GB', 'United Kingdom'], ['IE', 'Ireland'], ['DE', 'Germany'], ['FR', 'France'],
  ['IN', 'India'], ['CA', 'Canada'], ['AU', 'Australia'], ['ES', 'Spain'], ['IT', 'Italy'], ['NL', 'Netherlands'],
  ['BR', 'Brazil'],
] as const
const OPS_AM = ['Aisha Khan', 'Ben Murphy', 'Chloe Walsh', 'Dev Sharma', 'Emma Byrne', 'Finn O’Neill']
const BD_AM = ['Grace Kelly', 'Hugo Martin', 'Isla Doyle', 'Jay Mehta', 'Kara Nolan', 'Liam Brennan']

export interface DimValue extends Option {
  weight: number
  /** small revenue-per-click multiplier so filtered views look different */
  rpcMul: number
  publisherId?: string
}

const make = (key: FilterKey, labels: readonly string[], idPrefix: string): DimValue[] =>
  labels.map((label, i) => ({
    id: `${idPrefix}-${i + 1}`,
    label,
    weight: randRange(`${key}:${i}:w`, 0.4, 1.6),
    rpcMul: randRange(`${key}:${i}:r`, 0.9, 1.12),
  }))

const publishers = make('publisher', PUBLISHERS, 'pub')

const subIds: DimValue[] = publishers.flatMap((p, pi) => {
  const code = p.label.replace(/[^A-Z]/g, '').slice(0, 3) || 'PUB'
  const count = 4 + Math.floor(randRange(`subcount:${pi}`, 0, 3))
  return Array.from({ length: count }, (_, i) => ({
    id: `sub-${pi + 1}-${i + 1}`,
    label: `${code}-${1000 + pi * 37 + i * 11}`,
    weight: p.weight * randRange(`sub:${pi}:${i}:w`, 0.1, 0.4),
    rpcMul: p.rpcMul * randRange(`sub:${pi}:${i}:r`, 0.95, 1.05),
    publisherId: p.id,
  }))
})

export const DIMENSIONS: Record<FilterKey, DimValue[]> = {
  publisher: publishers,
  subId: subIds,
  tag: make('tag', TAGS, 'tag'),
  brand: make('brand', BRANDS, 'brand'),
  advertiser: make('advertiser', ADVERTISERS, 'adv'),
  campaign: make('campaign', CAMPAIGNS, 'cmp'),
  country: COUNTRIES.map(([code, name], i) => ({
    id: code,
    label: name,
    // bigger markets get more traffic
    weight: [3.2, 1.6, 0.6, 1.3, 1.1, 1.8, 0.9, 0.7, 0.6, 0.6, 0.5, 0.9][i],
    rpcMul: [1.15, 1.08, 1.05, 1.06, 1.02, 0.7, 1.04, 1.03, 0.92, 0.93, 1.0, 0.78][i],
  })),
  opsAm: make('opsAm', OPS_AM, 'ops'),
  bdAm: make('bdAm', BD_AM, 'bd'),
}

export const FILTER_KEYS = Object.keys(DIMENSIONS) as FilterKey[]

/** Per-leaf behaviour: share of requests and typical rates */
export const LEAF_PROFILES: Record<
  string,
  { share: number; win: number; ctr: number; cr: number; tacCpc: number; rpc: number; aov: number }
> = {
  manual: { share: 0.22, win: 0.125, ctr: 0.11, cr: 0.08, tacCpc: 1.55, rpc: 1.8, aov: 38 },
  'rule-max': { share: 0.17, win: 0.118, ctr: 0.13, cr: 0.07, tacCpc: 1.68, rpc: 1.88, aov: 40 },
  'rule-under': { share: 0.16, win: 0.112, ctr: 0.14, cr: 0.065, tacCpc: 1.62, rpc: 1.79, aov: 36 },
  'smart-profit': { share: 0.14, win: 0.13, ctr: 0.15, cr: 0.09, tacCpc: 1.4, rpc: 2.05, aov: 45 },
  'smart-loss': { share: 0.07, win: 0.1, ctr: 0.09, cr: 0.04, tacCpc: 1.75, rpc: 1.45, aov: 30 },
  'smart-new': { share: 0.08, win: 0.105, ctr: 0.12, cr: 0.06, tacCpc: 1.5, rpc: 1.7, aov: 35 },
  'smart-test': { share: 0.06, win: 0.1, ctr: 0.11, cr: 0.055, tacCpc: 1.55, rpc: 1.66, aov: 34 },
  'smart-soft': { share: 0.05, win: 0.108, ctr: 0.115, cr: 0.06, tacCpc: 1.52, rpc: 1.72, aov: 36 },
  'smart-hard': { share: 0.05, win: 0.102, ctr: 0.1, cr: 0.05, tacCpc: 1.58, rpc: 1.62, aov: 33 },
}

export const LEAF_IDS = Object.keys(LEAF_PROFILES)
