// Скрипт для обновления цветов ролей
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Не найдены переменные окружения');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const AVAILABLE_COLORS = [
  'blue', 'green', 'cyan', 'purple', 'magenta', 'volcano',
  'orange', 'gold', 'lime', 'geekblue', 'red', 'pink'
];

async function updateRoleColors() {
  console.log('🎨 Обновление цветов ролей...\n');

  try {
    // Получаем все роли
    const { data: roles, error: fetchError } = await supabase
      .from('roles')
      .select('code, name, color')
      .order('name');

    if (fetchError) {
      console.error('❌ Ошибка получения ролей:', fetchError.message);
      return;
    }

    console.log(`📋 Найдено ролей: ${roles.length}\n`);

    let updatedCount = 0;
    const usedColors = new Set();

    // Собираем уже использованные цвета
    roles.forEach(role => {
      if (role.color && role.color !== 'default') {
        usedColors.add(role.color);
      }
    });

    // Обновляем роли без цвета
    for (const role of roles) {
      if (!role.color || role.color === 'default') {
        // Выбираем случайный неиспользованный цвет
        const availableColors = AVAILABLE_COLORS.filter(c => !usedColors.has(c));
        const colorsPool = availableColors.length > 0 ? availableColors : AVAILABLE_COLORS;
        const randomColor = colorsPool[Math.floor(Math.random() * colorsPool.length)];

        console.log(`🔄 Обновляем роль "${role.name}" (${role.code})...`);
        console.log(`   Новый цвет: ${randomColor}`);

        const { error: updateError } = await supabase
          .from('roles')
          .update({ color: randomColor })
          .eq('code', role.code);

        if (updateError) {
          console.log(`   ❌ Ошибка: ${updateError.message}\n`);
        } else {
          console.log(`   ✅ Успешно\n`);
          usedColors.add(randomColor);
          updatedCount++;
        }
      } else {
        console.log(`⏭️  "${role.name}" - уже есть цвет: ${role.color}`);
      }
    }

    console.log('━'.repeat(80));
    console.log(`\n📊 Результаты:`);
    console.log(`   ✅ Обновлено: ${updatedCount}`);
    console.log(`   ⏭️  Пропущено: ${roles.length - updatedCount}\n`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

updateRoleColors();
