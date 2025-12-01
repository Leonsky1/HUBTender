import { useState, useCallback } from 'react';
import type { SourceRule } from '../utils';

export function useSourceRules() {
  const [sourceRules, setSourceRules] = useState<SourceRule[]>([]);

  const addRule = useCallback((rule: SourceRule) => {
    setSourceRules((prev) => [...prev, rule]);
  }, []);

  const removeRule = useCallback((index: number) => {
    setSourceRules((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateRule = useCallback((index: number, rule: SourceRule) => {
    setSourceRules((prev) => prev.map((r, i) => (i === index ? rule : r)));
  }, []);

  const clearRules = useCallback(() => {
    setSourceRules([]);
  }, []);

  const setRules = useCallback((rules: SourceRule[]) => {
    setSourceRules(rules);
  }, []);

  return {
    sourceRules,
    addRule,
    removeRule,
    updateRule,
    clearRules,
    setRules,
  };
}
