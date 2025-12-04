// Скрипт для синхронизации паролей: устанавливает в auth.users пароли из public.users
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Не найдены переменные окружения');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncPasswords() {
  console.log('🔄 Синхронизация паролей из public.users → auth.users...\n');

  try {
    // Получаем всех пользователей из public.users
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, full_name, password');

    if (publicError) {
      console.error('❌ Ошибка чтения public.users:', publicError.message);
      return;
    }

    console.log(`📋 Найдено ${publicUsers.length} пользователей в public.users\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of publicUsers) {
      if (!user.password) {
        console.log(`⏭️  ${user.email} - пароль не установлен, пропускаем`);
        continue;
      }

      console.log(`🔄 Обновляем пароль для ${user.email}...`);
      console.log(`   Имя: ${user.full_name}`);
      console.log(`   Устанавливаем пароль: ${user.password}`);

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: user.password }
      );

      if (updateError) {
        console.log(`   ❌ Ошибка: ${updateError.message}\n`);
        errorCount++;
      } else {
        console.log(`   ✅ Успешно обновлено\n`);
        successCount++;
      }
    }

    console.log('━'.repeat(80));
    console.log(`\n📊 Результаты:`);
    console.log(`   ✅ Успешно: ${successCount}`);
    console.log(`   ❌ Ошибок: ${errorCount}`);
    console.log(`   ⏭️  Пропущено: ${publicUsers.length - successCount - errorCount}\n`);

    if (successCount > 0) {
      console.log('🎉 Теперь вы можете войти с паролями из колонки password в таблице users!');
      console.log('\n📋 Пароли для входа:');
      publicUsers.forEach(user => {
        if (user.password) {
          console.log(`   ${user.email} → ${user.password}`);
        }
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

syncPasswords();
