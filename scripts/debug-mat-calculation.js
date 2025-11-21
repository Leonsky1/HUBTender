import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMatCalculation() {
  console.log('\n🔍 ОТЛАДКА РАСЧЁТА МАТЕРИАЛОВ (МАТ)\n');
  console.log('═══════════════════════════════════════════\n');

  // Получаем тендер и тактику
  const { data: tender } = await supabase
    .from('tenders')
    .select(`
      *,
      markup_tactics (*)
    `)
    .eq('title', 'ЖК Адмирал')
    .single();

  const sequences = tender.markup_tactics.sequences;
  const matSequence = sequences['мат'];

  console.log('📝 СХЕМА РАСЧЁТА ДЛЯ МАТ:\n');
  matSequence.forEach((step, idx) => {
    console.log(`Шаг ${idx + 1}: ${step.name}`);
    console.log(`  baseIndex: ${step.baseIndex}`);
    console.log(`  action1: ${step.action1}, operand1Type: ${step.operand1Type}, operand1Key: ${step.operand1Key}`);
    if (step.action2) {
      console.log(`  action2: ${step.action2}, operand2Type: ${step.operand2Type}, operand2Index: ${step.operand2Index}`);
    }
    console.log('');
  });

  console.log('\n📊 ПРОБЛЕМНЫЙ ШАГ: "ООЗ промежуточно" (шаг 3)\n');
  const problemStep = matSequence[2];
  console.log(JSON.stringify(problemStep, null, 2));

  console.log('\n📌 АНАЛИЗ:\n');
  console.log('Этот шаг делает:');
  console.log('  1. baseIndex: 0 → берём результат шага 1 (110.00)');
  console.log('  2. action1: add, operand1Type: step, operand1Index: 1');
  console.log('     → добавляем результат шага 2 (103.00)');
  console.log('  3. action2: subtract, operand2Type: step, operand2Index: -1');
  console.log('     → вычитаем ???');
  console.log('');
  console.log('❌ ПРОБЛЕМА: operand2Index: -1 означает...');
  console.log('   В getOperandValue для type="step" индекс -1 недопустим!');
  console.log('   Код выбрасывает ошибку: "Недопустимый индекс шага: -1"');
  console.log('');
  console.log('💡 ВОЗМОЖНЫЕ РЕШЕНИЯ:');
  console.log('   1. operand2Index: -1 должен означать baseAmount');
  console.log('   2. Или схема неправильная и там должен быть другой индекс');

  console.log('\n═══════════════════════════════════════════\n');
}

debugMatCalculation();
