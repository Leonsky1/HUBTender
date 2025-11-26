import { TabKey, MarkupSequences, BaseCosts, OperandState } from './types';

export const ACTIONS = [
  { value: 'multiply', label: '× Умножить', symbol: '×' },
  { value: 'divide', label: '÷ Разделить', symbol: '÷' },
  { value: 'add', label: '+ Сложить', symbol: '+' },
  { value: 'subtract', label: '− Вычесть', symbol: '−' },
] as const;

export const TAB_KEYS: TabKey[] = [
  'раб',
  'мат',
  'суб-раб',
  'суб-мат',
  'раб-комп.',
  'мат-комп.',
];

export const TAB_LABELS: Record<TabKey, string> = {
  'раб': 'Работы (раб)',
  'мат': 'Материалы (мат)',
  'суб-раб': 'Субподрядные работы (суб-раб)',
  'суб-мат': 'Субподрядные материалы (суб-мат)',
  'раб-комп.': 'Работы компании (раб-комп.)',
  'мат-комп.': 'Материалы компании (мат-комп.)',
};

export const INITIAL_MARKUP_SEQUENCES: MarkupSequences = {
  'раб': [],
  'мат': [],
  'суб-раб': [],
  'суб-мат': [],
  'раб-комп.': [],
  'мат-комп.': [],
};

export const INITIAL_BASE_COSTS: BaseCosts = {
  'раб': 0,
  'мат': 0,
  'суб-раб': 0,
  'суб-мат': 0,
  'раб-комп.': 0,
  'мат-комп.': 0,
};

export function createInitialOperandState<T>(defaultValue: T): OperandState<T> {
  return {
    'раб': defaultValue,
    'мат': defaultValue,
    'суб-раб': defaultValue,
    'суб-мат': defaultValue,
    'раб-комп.': defaultValue,
    'мат-комп.': defaultValue,
  };
}