console.log('\n🔍 СИМУЛЯЦИЯ РАСЧЁТА ДЛЯ МАТ\n');
console.log('═══════════════════════════════════════════\n');

// Параметры наценок
const params = {
  material_cost_growth: 10, // %
  contingency_costs: 3, // %
  overhead_own_forces: 10, // %
  general_costs_without_subcontract: 20, // %
  profit_own_forces: 10  // %
};

console.log('📝 ПАРАМЕТРЫ НАЦЕНОК:');
Object.entries(params).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}%`);
});

// Схема для МАТ
const sequence = [
  {
    name: "Материалы РОСТ",
    baseIndex: -1, // baseAmount
    action1: "multiply",
    operand1Type: "markup",
    operand1Key: "material_cost_growth",
    operand1MultiplyFormat: "addOne" // (1 + %/100)
  },
  {
    name: "Непредвиденные",
    baseIndex: -1, // baseAmount
    action1: "multiply",
    operand1Type: "markup",
    operand1Key: "contingency_costs",
    operand1MultiplyFormat: "addOne"
  },
  {
    name: "ООЗ промежуточно",
    baseIndex: 0, // step[0]
    action1: "add",
    operand1Type: "step",
    operand1Index: 1, // step[1]
    action2: "subtract",
    operand2Type: "step",
    operand2Index: -1 // ← СПЕЦИАЛЬНЫЙ СЛУЧАЙ: baseAmount
  },
  {
    name: "ООЗ",
    baseIndex: 2, // step[2]
    action1: "multiply",
    operand1Type: "markup",
    operand1Key: "overhead_own_forces",
    operand1MultiplyFormat: "addOne"
  },
  {
    name: "ОФЗ",
    baseIndex: 3, // step[3]
    action1: "multiply",
    operand1Type: "markup",
    operand1Key: "general_costs_without_subcontract",
    operand1MultiplyFormat: "addOne"
  },
  {
    name: "Прибыль",
    baseIndex: 4, // step[4]
    action1: "multiply",
    operand1Type: "markup",
    operand1Key: "profit_own_forces",
    operand1MultiplyFormat: "addOne"
  }
];

function getOperandValue(operandType, operandKey, operandIndex, multiplyFormat, stepResults, baseAmount) {
  switch (operandType) {
    case 'markup':
      const value = params[operandKey];
      if (multiplyFormat === 'addOne') {
        return 1 + value / 100;
      }
      return value / 100;

    case 'step':
      if (operandIndex === -1) {
        return baseAmount; // ← НАШ ФИ КС
      }
      return stepResults[operandIndex];

    case 'number':
      return operandKey;
  }
}

function applyOperation(base, action, operand) {
  switch (action) {
    case 'multiply': return base * operand;
    case 'divide': return base / operand;
    case 'add': return base + operand;
    case 'subtract': return base - operand;
  }
}

// Расчёт
const baseAmount = 100; // База для коэффициента
const stepResults = [];

console.log(`\n🧮 ПОШАГОВЫЙ РАСЧЁТ (база: ${baseAmount}):\n`);

for (let i = 0; i < sequence.length; i++) {
  const step = sequence[i];

  // Определяем базу для этого шага
  let baseValue;
  if (step.baseIndex === -1) {
    baseValue = baseAmount;
  } else {
    baseValue = stepResults[step.baseIndex];
  }

  console.log(`${i + 1}. ${step.name}`);
  console.log(`   База: ${baseValue.toFixed(2)} (baseIndex: ${step.baseIndex})`);

  // Получаем операнд1
  const operand1 = getOperandValue(
    step.operand1Type,
    step.operand1Key,
    step.operand1Index,
    step.operand1MultiplyFormat,
    stepResults,
    baseAmount
  );
  console.log(`   Операнд1: ${operand1.toFixed(4)} (тип: ${step.operand1Type})`);

  let result = applyOperation(baseValue, step.action1, operand1);
  console.log(`   После action1 (${step.action1}): ${result.toFixed(2)}`);

  // Если есть action2
  if (step.action2) {
    const operand2 = getOperandValue(
      step.operand2Type,
      step.operand2Key,
      step.operand2Index,
      step.operand2MultiplyFormat,
      stepResults,
      baseAmount
    );
    console.log(`   Операнд2: ${operand2.toFixed(4)} (индекс: ${step.operand2Index})`);
    result = applyOperation(result, step.action2, operand2);
    console.log(`   После action2 (${step.action2}): ${result.toFixed(2)}`);
  }

  stepResults.push(result);
  console.log(`   ➡️  Результат шага: ${result.toFixed(2)}\n`);
}

const finalCoefficient = stepResults[stepResults.length - 1] / baseAmount;
console.log('═══════════════════════════════════════════');
console.log(`\n✅ ИТОГОВЫЙ КОЭФФИЦИЕНТ: ${finalCoefficient.toFixed(6)}`);
console.log(`   (${stepResults[stepResults.length - 1].toFixed(2)} / ${baseAmount} = ${finalCoefficient.toFixed(6)})\n`);

console.log('📊 СРАВНЕНИЕ С ФАКТИЧЕСКИМ:');
console.log(`   Расчётный: ${finalCoefficient.toFixed(6)}`);
console.log(`   Фактический: 1.495560 (из БД)`);
console.log(`   Разница: ${Math.abs(finalCoefficient - 1.495560).toFixed(6)}\n`);

console.log('═══════════════════════════════════════════\n');
