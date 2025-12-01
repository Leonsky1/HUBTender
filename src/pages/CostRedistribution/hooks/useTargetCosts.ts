import { useState, useCallback } from 'react';
import type { TargetCost } from '../utils';

export function useTargetCosts() {
  const [targetCosts, setTargetCosts] = useState<TargetCost[]>([]);

  const addTarget = useCallback((target: TargetCost) => {
    setTargetCosts((prev) => [...prev, target]);
  }, []);

  const removeTarget = useCallback((index: number) => {
    setTargetCosts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateTarget = useCallback((index: number, target: TargetCost) => {
    setTargetCosts((prev) => prev.map((t, i) => (i === index ? target : t)));
  }, []);

  const clearTargets = useCallback(() => {
    setTargetCosts([]);
  }, []);

  const setTargets = useCallback((targets: TargetCost[]) => {
    setTargetCosts(targets);
  }, []);

  return {
    targetCosts,
    addTarget,
    removeTarget,
    updateTarget,
    clearTargets,
    setTargets,
  };
}
