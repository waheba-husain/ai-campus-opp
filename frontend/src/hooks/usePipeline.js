import { useState, useEffect, useCallback } from 'react'
import { pipelineApi } from '../lib/api'

export const PIPELINE_STATUSES = ['saved', 'preparing', 'applied', 'result']

export function usePipeline() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPipeline = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await pipelineApi.list()
      setItems(data.pipeline || [])
    } catch (err) {
      setError(err.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPipeline()
  }, [fetchPipeline])

  const updateStatus = useCallback(async (itemId, newStatus) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, status: newStatus } : item
    ))
    try {
      const result = await pipelineApi.update(itemId, { status: newStatus })
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, ...result.pipelineItem } : item
      ))
      return { ok: true }
    } catch (err) {
      // Revert optimistic update
      fetchPipeline()
      return { ok: false, error: err.message }
    }
  }, [fetchPipeline])

  const updateNotes = useCallback(async (itemId, notes) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, notes } : item
    ))
    try {
      const result = await pipelineApi.update(itemId, { notes })
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, ...result.pipelineItem } : item
      ))
      return { ok: true }
    } catch (err) {
      fetchPipeline()
      return { ok: false, error: err.message }
    }
  }, [fetchPipeline])

  const addToPipeline = useCallback(async (opportunityId, status = 'saved', notes = null) => {
    try {
      const result = await pipelineApi.add(opportunityId, status, notes)
      setItems(prev => [result.pipelineItem, ...prev])
      return { ok: true, item: result.pipelineItem }
    } catch (err) {
      return { ok: false, error: err.message, status: err.status }
    }
  }, [])

  const removeFromPipeline = useCallback(async (itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
    try {
      await pipelineApi.remove(itemId)
      return { ok: true }
    } catch (err) {
      fetchPipeline()
      return { ok: false, error: err.message }
    }
  }, [fetchPipeline])

  return {
    items,
    loading,
    error,
    refetch: fetchPipeline,
    updateStatus,
    updateNotes,
    addToPipeline,
    removeFromPipeline,
  }
}