// Проверка структуры таблицы roles и связи с users
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Не найдены переменные окружения');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRolesStructure() {
  console.log('🔍 Проверка таблицы roles...\n');

  try {
    // Проверяем таблицу roles
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*');

    if (rolesError) {
      console.error('❌ Ошибка чтения roles:', rolesError.message);
      console.log('\n⚠️  Таблица roles не найдена или нет доступа\n');
    } else {
      console.log(`✅ Найдено ${roles.length} ролей в таблице roles:\n`);
      roles.forEach((role, index) => {
        console.log(`${index + 1}. Роль: ${role.role || role.name || 'N/A'}`);
        console.log(`   Код: ${role.role_code}`);
        console.log(`   Поля:`, Object.keys(role).join(', '));
        if (role.allowed_pages) {
          console.log(`   Allowed pages:`, JSON.stringify(role.allowed_pages));
        }
        console.log('');
      });
    }

    // Проверяем связь users -> roles
    console.log('🔗 Проверка связи users.role_code -> roles.role_code:\n');

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, role_code');

    if (usersError) {
      console.error('❌ Ошибка:', usersError.message);
      return;
    }

    console.log('📋 Пользователи и их role_code:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   role: "${user.role}"`);
      console.log(`   role_code: "${user.role_code}"`);

      if (roles) {
        const matchingRole = roles.find(r => r.role_code === user.role_code);
        console.log(`   ${matchingRole ? '✅' : '❌'} Связь с roles найдена: ${matchingRole ? matchingRole.role || matchingRole.name : 'НЕТ'}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

checkRolesStructure();
