import { useState, useEffect, useCallback } from 'react'
import { opportunitiesApi } from '../lib/api'

/**
 * Hook for fetching ranked opportunities with triage filter
 */
export function useOpportunities() {
  const [ranked, setRanked] = useState([])
  const [triage, setTriage] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [triageLoading, setTriageLoading] = useState(false)

  const fetchRanked = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const data = await opportunitiesApi.ranked(params)
      setRanked(data.ranked || [])
    } catch (err) {
      setError(err.message)
      setRanked([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTriage = useCallback(async () => {
    setTriageLoading(true)
    try {
      const data = await opportunitiesApi.triage()
      setTriage(data.triage || [])
    } catch (err) {
      console.error('Triage fetch error:', err)
      setTriage([])
    } finally {
      setTriageLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchRanked()
    fetchTriage()
  }, [fetchRanked, fetchTriage])

  return {
    ranked,
    triage,
    loading,
    triageLoading,
    error,
    fetchRanked,
    fetchTriage,
    refetch: () => { fetchRanked(); fetchTriage(); },
  }
}

/**
 * Hook for fetching a single opportunity detail
 */
export function useOpportunityDetail(id) {
  const [opportunity, setOpportunity] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await opportunitiesApi.detail(id)
      setOpportunity(data.opportunity)
    } catch (err) {
      setError(err.message)
      setOpportunity(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { opportunity, loading, error, refetch: fetch }
}

/**
 * Hook for fetching prep checklist
 */
export function usePrepChecklist(opportunityId) {
  const [prep, setPrep] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!opportunityId) return
    setLoading(true)
    setError(null)
    try {
      const data = await opportunitiesApi.prep(opportunityId)
      setPrep(data.prep)
    } catch (err) {
      setError(err.message)
      setPrep(null)
    } finally {
      setLoading(false)
    }
  }, [opportunityId])

  return { prep, loading, error, fetch }
}

/**
 * Hook for extracting a structured opportunity from raw pasted text
 */
export function useExtractOpportunity() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const extract = useCallback(async (rawText) => {
    setLoading(true)
    setError(null)
    try {
      const data = await opportunitiesApi.extract(rawText)
      setResult(data.opportunity || data.extracted || data)
      return data
    } catch (err) {
      setError(err.message)
      setResult(null)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = () => {
    setResult(null)
    setError(null)
  }

  return { result, loading, error, extract, reset }
}
/**
 * Hook for pasting a big message -> many candidates -> save the chosen ones
 */
export function useBulkExtract() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const extractBulk = useCallback(async (rawText) => {
    setLoading(true)
    setError(null)
    try {
      const data = await opportunitiesApi.extractBulk(rawText)
      const list = data.candidates || []
      setCandidates(list)
      return list
    } catch (err) {
      setError(err.message)
      setCandidates([])
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSelected = useCallback(async (selected) => {
    setSaving(true)
    setError(null)
    try {
      return await opportunitiesApi.bulkSave(selected)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  const reset = useCallback(() => {
    setCandidates([])
    setError(null)
  }, [])

  return { candidates, loading, saving, error, extractBulk, saveSelected, reset }
}