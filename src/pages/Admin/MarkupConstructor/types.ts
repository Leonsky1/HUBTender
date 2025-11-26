export interface MarkupStep {
  name?: string;
  baseIndex: number;

  action1: 'multiply' | 'divide' | 'add' | 'subtract';
  operand1Type: 'markup' | 'step' | 'number';
  operand1Key?: string | number;
  operand1Index?: number;
  operand1MultiplyFormat?: 'addOne' | 'direct';

  action2?: 'multiply' | 'divide' | 'add' | 'subtract';
  operand2Type?: 'markup' | 'step' | 'number';
  operand2Key?: string | number;
  operand2Index?: number;
  operand2MultiplyFormat?: 'addOne' | 'direct';

  action3?: 'multiply' | 'divide' | 'add' | 'subtract';
  operand3Type?: 'markup' | 'step' | 'number';
  operand3Key?: string | number;
  operand3Index?: number;
  operand3MultiplyFormat?: 'addOne' | 'direct';

  action4?: 'multiply' | 'divide' | 'add' | 'subtract';
  operand4Type?: 'markup' | 'step' | 'number';
  operand4Key?: string | number;
  operand4Index?: number;
  operand4MultiplyFormat?: 'addOne' | 'direct';

  action5?: 'multiply' | 'divide' | 'add' | 'subtract';
  operand5Type?: 'markup' | 'step' | 'number';
  operand5Key?: string | number;
  operand5Index?: number;
  operand5MultiplyFormat?: 'addOne' | 'direct';
}

export type TabKey =
  | 'раб'
  | 'мат'
  | 'суб-раб'
  | 'суб-мат'
  | 'раб-комп.'
  | 'мат-комп.';

export type ActionType = 'multiply' | 'divide' | 'add' | 'subtract';
export type OperandType = 'markup' | 'step' | 'number';
export type MultiplyFormat = 'addOne' | 'direct';
export type InputMode = 'select' | 'manual';

export type MarkupSequences = {
  [K in TabKey]: MarkupStep[];
};

export type BaseCosts = {
  [K in TabKey]: number;
};

export type OperandState<T> = Record<TabKey, T>;