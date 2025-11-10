// Проверка данных в таблице detail_cost_categories
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vswxtmkdsimwgmvzysdo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzd3h0bWtkc2ltd2dtdnp5c2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTYzNTAsImV4cCI6MjA3Nzk5MjM1MH0.sCtBZL_pH8knNrFJqfx7uPMLlos_9HAzkaArlpOyfDY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testData() {
  console.log('=== Проверка данных в detail_cost_categories ===\n');

  const { data: details, error } = await supabase
    .from('detail_cost_categories')
    .select('*, cost_categories(*)')
    .order('order_num')
    .limit(10);

  if (error) {
    console.error('Ошибка:', error);
    return;
  }

  console.log(`Найдено ${details?.length || 0} записей:\n`);

  details?.forEach(detail => {
    console.log(`ID: ${detail.id}`);
    console.log(`  Order: ${detail.order_num}`);
    console.log(`  Name: ${detail.name}`);
    console.log(`  Unit: ${detail.unit}`);
    console.log(`  Location: ${detail.location}`);
    console.log(`  Category: ${detail.cost_categories?.name}`);
    console.log('---');
  });

  // Проверка уникальных локаций
  const locations = [...new Set(details?.map(d => d.location))];
  console.log('\nУникальные локации:', locations);
}

testData();