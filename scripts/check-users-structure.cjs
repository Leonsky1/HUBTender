// Проверка структуры таблицы users в реальной БД
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Не найдены переменные окружения VITE_SUPABASE_URL или VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersStructure() {
  console.log('🔍 Проверка структуры таблицы public.users...\n');

  try {
    // Проверяем структуру таблицы через information_schema
    const { data: columns, error: columnsError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'users'
          ORDER BY ordinal_position;
        `
      });

    if (columnsError) {
      // Если RPC не работает, попробуем прямой запрос
      console.log('⚠️  RPC недоступен, пробую прямой SELECT...\n');

      const { data: users, error: selectError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (selectError) {
        console.error('❌ Ошибка чтения таблицы users:', selectError.message);
        return;
      }

      if (!users || users.length === 0) {
        console.log('✅ Таблица users существует, но пуста');
        console.log('\n📋 Для проверки структуры откройте Supabase Dashboard:');
        console.log('   → Table Editor → users → View table structure');
        return;
      }

      console.log('✅ Таблица users существует\n');
      console.log('📋 Поля в таблице (из первой записи):');
      Object.keys(users[0]).forEach((key, index) => {
        console.log(`   ${index + 1}. ${key}: ${typeof users[0][key]} = ${JSON.stringify(users[0][key])}`);
      });

      // Проверяем наличие критичных полей
      console.log('\n🔍 Проверка критичных полей:');
      const requiredFields = ['id', 'email', 'full_name', 'role', 'access_status', 'password', 'allowed_pages', 'access_enabled'];
      requiredFields.forEach(field => {
        const exists = field in users[0];
        console.log(`   ${exists ? '✅' : '❌'} ${field}`);
      });

      // Проверяем auth.users
      console.log('\n🔍 Проверка auth.users...');
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        console.log('   ⚠️  Нет доступа к auth.users (нужен SERVICE_ROLE_KEY)');
      } else {
        console.log(`   ✅ Найдено ${authUsers.users.length} пользователей в auth.users`);
        if (authUsers.users.length > 0) {
          console.log(`   📧 Emails: ${authUsers.users.map(u => u.email).join(', ')}`);
        }
      }

      return;
    }

    console.log('✅ Структура таблицы users:\n');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name}`);
      console.log(`   Тип: ${col.data_type}`);
      console.log(`   NULL: ${col.is_nullable}`);
      if (col.column_default) {
        console.log(`   Default: ${col.column_default}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

checkUsersStructure();
