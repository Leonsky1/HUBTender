import { useState } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { supabase } from '../../../../lib/supabase';

const { confirm } = Modal;

// Очистка имени для сравнения (убираем все лишние пробелы)
const cleanName = (name: string): string => {
  return name
    .replace(/\s+/g, ' ')  // Схлопнуть все whitespace символы в один пробел
    .trim()                // Убрать пробелы с краев
    .replace(/[.,;:!?]+$/, ''); // Убрать trailing пунктуацию
};

// Унификация наименования для сравнения дубликатов
const normalizeName = (name: string): string => {
  return cleanName(name).toLowerCase();
};

export interface WorkRecord {
  key: string;
  id: string;
  name: string;
  unit: string;
  created_at: string;
}

export const useWorks = () => {
  const [worksData, setWorksData] = useState<WorkRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);

  const loadWorks = async () => {
    setLoading(true);
    try {
      // Загружаем данные батчами, так как Supabase ограничивает 1000 строк за запрос
      let allWorks: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('work_names')
          .select('*')
          .order('name')
          .range(from, from + batchSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allWorks = [...allWorks, ...data];
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      const formattedData: WorkRecord[] = allWorks.map((item: any) => ({
        key: item.id,
        id: item.id,
        name: item.name,
        unit: item.unit,
        created_at: new Date(item.created_at).toLocaleDateString('ru-RU'),
      }));

      console.log(`[Nomenclatures/Works] Loaded ${formattedData.length} works`);
      setWorksData(formattedData);
    } catch (error) {
      console.error('Ошибка загрузки работ:', error);
      message.error('Ошибка загрузки работ');
    } finally {
      setLoading(false);
    }
  };

  const saveWork = async (values: any, editingWorkId?: string) => {
    try {
      if (editingWorkId) {
        const { error } = await supabase
          .from('work_names')
          .update({
            name: values.name,
            unit: values.unit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingWorkId);

        if (error) throw error;
        message.success('Работа обновлена');
      } else {
        // Проверка на дубликат перед вставкой
        const normalizedInputName = normalizeName(values.name);
        const { data: existingWorks, error: checkError } = await supabase
          .from('work_names')
          .select('name, unit')
          .eq('unit', values.unit);

        if (checkError) throw checkError;

        // Проверяем нормализованные имена
        const duplicate = existingWorks?.find(
          (work) => normalizeName(work.name) === normalizedInputName
        );

        if (duplicate) {
          message.warning(`Работа "${duplicate.name}" с единицей "${duplicate.unit}" уже существует`);
          return false;
        }

        const { error } = await supabase
          .from('work_names')
          .insert([{
            name: values.name,
            unit: values.unit,
          }]);

        if (error) throw error;
        message.success('Работа добавлена');
      }

      await loadWorks();
      return true;
    } catch (error: any) {
      console.error('Ошибка сохранения работы:', error);
      message.error(error.message || 'Ошибка сохранения работы');
      return false;
    }
  };

  const deleteWork = (record: WorkRecord) => {
    const theme = localStorage.getItem('tenderHub_theme') || 'light';

    confirm({
      title: 'Подтверждение удаления',
      icon: <ExclamationCircleOutlined />,
      content: `Вы уверены, что хотите удалить работу "${record.name}"?`,
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      rootClassName: theme === 'dark' ? 'dark-modal' : '',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('work_names')
            .delete()
            .eq('id', record.id);

          if (error) throw error;

          message.success('Работа удалена');
          await loadWorks();
        } catch (error: any) {
          console.error('Ошибка удаления работы:', error);
          message.error(error.message || 'Ошибка удаления работы');
        }
      },
    });
  };

  // Поиск дублей по нормализованному имени + единице
  const findDuplicates = (): Set<string> => {
    const seen = new Map<string, number>();
    const duplicateKeys = new Set<string>();

    worksData.forEach((work) => {
      const key = `${normalizeName(work.name)}|${work.unit}`;
      const count = seen.get(key) || 0;
      seen.set(key, count + 1);

      if (count > 0) {
        duplicateKeys.add(key);
      }
    });

    return duplicateKeys;
  };

  // Фильтрация данных
  const getFilteredData = (): WorkRecord[] => {
    if (!showDuplicatesOnly) {
      return worksData;
    }

    const duplicateKeys = findDuplicates();
    return worksData.filter((work) => {
      const key = `${normalizeName(work.name)}|${work.unit}`;
      return duplicateKeys.has(key);
    });
  };

  const toggleDuplicatesFilter = () => {
    setShowDuplicatesOnly(!showDuplicatesOnly);
  };

  return {
    worksData: getFilteredData(),
    loading,
    showDuplicatesOnly,
    loadWorks,
    saveWork,
    deleteWork,
    toggleDuplicatesFilter,
  };
};
