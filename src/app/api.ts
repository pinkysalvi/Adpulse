import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  BucketsResponse,
  DataView,
  FilterKey,
  FilterOptionsResponse,
  Filters,
  Granularity,
  MetaResponse,
  PerformanceResponse,
  StrategyDataResponse,
  SummaryResponse,
} from '../../server/types'

export interface RangeArgs {
  from: string
  to: string
  filters: Filters
}

export interface StrategyDataArgs extends RangeArgs {
  strategy: string
  granularity: Granularity
  view: DataView
  sort: string
  dir: 'asc' | 'desc'
  page: number
  pageSize: number
}

/** { publisher: ['pub-1','pub-2'] } -> { publisher: 'pub-1,pub-2' } */
const filterParams = (filters: Filters) =>
  Object.fromEntries(Object.entries(filters).map(([key, ids]) => [key, ids!.join(',')]))

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  // keep results for 5 minutes so switching tabs or filters back is instant
  keepUnusedDataFor: 300,
  endpoints: build => ({
    getMeta: build.query<MetaResponse, void>({
      query: () => 'meta',
    }),
    getFilterOptions: build.query<FilterOptionsResponse, { key: FilterKey; search?: string; publishers?: string[] }>({
      query: ({ key, search, publishers }) => ({
        url: `filters/${key}`,
        params: { search: search || undefined, publishers: publishers?.length ? publishers.join(',') : undefined },
      }),
    }),
    getSummary: build.query<SummaryResponse, RangeArgs>({
      query: ({ from, to, filters }) => ({ url: 'summary', params: { from, to, ...filterParams(filters) } }),
    }),
    getPerformance: build.query<PerformanceResponse, RangeArgs>({
      query: ({ from, to, filters }) => ({ url: 'performance', params: { from, to, ...filterParams(filters) } }),
    }),
    getStrategyData: build.query<StrategyDataResponse, StrategyDataArgs>({
      query: ({ from, to, filters, ...rest }) => ({ url: 'strategy-data', params: { from, to, ...filterParams(filters), ...rest } }),
    }),
    getBuckets: build.query<BucketsResponse, RangeArgs>({
      query: ({ from, to, filters }) => ({ url: 'buckets', params: { from, to, ...filterParams(filters) } }),
    }),
  }),
})

export const {
  useGetMetaQuery,
  useGetFilterOptionsQuery,
  useGetSummaryQuery,
  useGetPerformanceQuery,
  useGetStrategyDataQuery,
  useGetBucketsQuery,
} = api
