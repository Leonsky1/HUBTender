import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Space,
  Form,
  Select,
  InputNumber,
  Input,
  Button,
  message,
  Spin,
  Tabs,
  Row,
  Col,
  Tag,
  Divider,
  theme,
  Radio
} from 'antd';
import { SaveOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, EditOutlined } from '@ant-design/icons';
import { supabase, Tender, TenderMarkupPercentageInsert } from '../../../lib/supabase';
import './MarkupConstructor.css';

const { Title, Text } = Typography;

// Доступные наценки для выбора
const AVAILABLE_MARKUPS = [
  { key: 'mechanization_service', label: 'Служба механизации' },
  { key: 'mbp_gsm', label: 'МБП и ГСМ' },
  { key: 'warranty_period', label: 'Гарантийный период' },
  { key: 'works_16_markup', label: 'Работы 1,6' },
  { key: 'works_cost_growth', label: 'Рост стоимости работ' },
  { key: 'material_cost_growth', label: 'Рост стоимости материалов' },
  { key: 'subcontract_works_cost_growth', label: 'Рост стоимости работ субподряда' },
  { key: 'subcontract_materials_cost_growth', label: 'Рост стоимости материалов субподряда' },
  { key: 'contingency_costs', label: 'Непредвиденные затраты' },
  { key: 'overhead_own_forces', label: 'ООЗ' },
  { key: 'overhead_subcontract', label: 'ООЗ субподряда' },
  { key: 'general_costs_without_subcontract', label: 'ОФЗ без субподряда' },
  { key: 'profit_own_forces', label: 'Прибыль' },
  { key: 'profit_subcontract', label: 'Прибыль субподряда' },
];

interface MarkupStep {
  name?: string; // Название пункта
  baseIndex: number; // -1 для базовой стоимости, или индекс пункта в массиве

  // Первая операция
  action1: 'multiply' | 'divide' | 'add' | 'subtract';
  operand1Type: 'markup' | 'step'; // наценка или результат другого шага
  operand1Key?: string; // ключ наценки (если operand1Type = 'markup')
  operand1Index?: number; // индекс шага (если operand1Type = 'step')
  operand1MultiplyFormat?: 'addOne' | 'direct'; // формат умножения: 'addOne' = (1 + %), 'direct' = %

  // Вторая операция (опциональная)
  action2?: 'multiply' | 'divide' | 'add' | 'subtract';
  operand2Type?: 'markup' | 'step';
  operand2Key?: string;
  operand2Index?: number;
  operand2MultiplyFormat?: 'addOne' | 'direct';

  // Третья операция (опциональная)
  action3?: 'multiply' | 'divide' | 'add' | 'subtract';
  operand3Type?: 'markup' | 'step';
  operand3Key?: string;
  operand3Index?: number;
  operand3MultiplyFormat?: 'addOne' | 'direct';

  // Четвертая операция (опциональная)
  action4?: 'multiply' | 'divide' | 'add' | 'subtract';
  operand4Type?: 'markup' | 'step';
  operand4Key?: string;
  operand4Index?: number;
  operand4MultiplyFormat?: 'addOne' | 'direct';

  // Пятая операция (опциональная)
  action5?: 'multiply' | 'divide' | 'add' | 'subtract';
  operand5Type?: 'markup' | 'step';
  operand5Key?: string;
  operand5Index?: number;
  operand5MultiplyFormat?: 'addOne' | 'direct';
}

type TabKey = 'works' | 'materials' | 'subcontract_works' | 'subcontract_materials' | 'work_comp' | 'material_comp';

const ACTIONS = [
  { value: 'multiply', label: '× Умножить', symbol: '×' },
  { value: 'divide', label: '÷ Разделить', symbol: '÷' },
  { value: 'add', label: '+ Сложить', symbol: '+' },
  { value: 'subtract', label: '− Вычесть', symbol: '−' },
] as const;

const MarkupConstructor: React.FC = () => {
  const [form] = Form.useForm();
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [currentMarkupId, setCurrentMarkupId] = useState<string | null>(null);
  const [currentTacticId, setCurrentTacticId] = useState<string | null>(null); // ID сохраненной тактики в БД
  const [activeTab, setActiveTab] = useState<TabKey>('works');
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Флаг для предотвращения автосохранения до загрузки

  // Состояния для порядка наценок на каждой вкладке
  const [markupSequences, setMarkupSequences] = useState<Record<TabKey, MarkupStep[]>>({
    works: [],
    materials: [],
    subcontract_works: [],
    subcontract_materials: [],
    work_comp: [],
    material_comp: [],
  });

  // Базовая стоимость для каждой вкладки
  const [baseCosts, setBaseCosts] = useState<Record<TabKey, number>>({
    works: 0,
    materials: 0,
    subcontract_works: 0,
    subcontract_materials: 0,
    work_comp: 0,
    material_comp: 0,
  });

  // Состояния для формы добавления наценок для каждой вкладки
  const [insertPositions, setInsertPositions] = useState<Record<TabKey, number | undefined>>({
    works: undefined,
    materials: undefined,
    subcontract_works: undefined,
    subcontract_materials: undefined,
    work_comp: undefined,
    material_comp: undefined,
  });

  // Первая операция
  const [action1, setAction1] = useState<Record<TabKey, 'multiply' | 'divide' | 'add' | 'subtract'>>({
    works: 'multiply',
    materials: 'multiply',
    subcontract_works: 'multiply',
    subcontract_materials: 'multiply',
    work_comp: 'multiply',
    material_comp: 'multiply',
  });

  const [operand1Type, setOperand1Type] = useState<Record<TabKey, 'markup' | 'step' | 'number'>>({
    works: 'markup',
    materials: 'markup',
    subcontract_works: 'markup',
    subcontract_materials: 'markup',
    work_comp: 'markup',
    material_comp: 'markup',
  });

  const [operand1Value, setOperand1Value] = useState<Record<TabKey, string | number | undefined>>({
    works: undefined,
    materials: undefined,
    subcontract_works: undefined,
    subcontract_materials: undefined,
    work_comp: undefined,
    material_comp: undefined,
  });

  const [operand1InputMode, setOperand1InputMode] = useState<Record<TabKey, 'select' | 'manual'>>({
    works: 'select',
    materials: 'select',
    subcontract_works: 'select',
    subcontract_materials: 'select',
    work_comp: 'select',
    material_comp: 'select',
  });

  const [operand1MultiplyFormat, setOperand1MultiplyFormat] = useState<Record<TabKey, 'addOne' | 'direct'>>({
    works: 'addOne',
    materials: 'addOne',
    subcontract_works: 'addOne',
    subcontract_materials: 'addOne',
    work_comp: 'addOne',
    material_comp: 'addOne',
  });

  // Вторая операция
  const [action2, setAction2] = useState<Record<TabKey, 'multiply' | 'divide' | 'add' | 'subtract'>>({
    works: 'multiply',
    materials: 'multiply',
    subcontract_works: 'multiply',
    subcontract_materials: 'multiply',
    work_comp: 'multiply',
    material_comp: 'multiply',
  });

  const [operand2Type, setOperand2Type] = useState<Record<TabKey, 'markup' | 'step'>>({
    works: 'markup',
    materials: 'markup',
    subcontract_works: 'markup',
    subcontract_materials: 'markup',
    work_comp: 'markup',
    material_comp: 'markup',
  });

  const [operand2Value, setOperand2Value] = useState<Record<TabKey, string | number | undefined>>({
    works: undefined,
    materials: undefined,
    subcontract_works: undefined,
    subcontract_materials: undefined,
    work_comp: undefined,
    material_comp: undefined,
  });

  const [operand2MultiplyFormat, setOperand2MultiplyFormat] = useState<Record<TabKey, 'addOne' | 'direct'>>({
    works: 'addOne',
    materials: 'addOne',
    subcontract_works: 'addOne',
    subcontract_materials: 'addOne',
    work_comp: 'addOne',
    material_comp: 'addOne',
  });

  // Третья операция
  const [action3, setAction3] = useState<Record<TabKey, 'multiply' | 'divide' | 'add' | 'subtract'>>({
    works: 'multiply',
    materials: 'multiply',
    subcontract_works: 'multiply',
    subcontract_materials: 'multiply',
    work_comp: 'multiply',
    material_comp: 'multiply',
  });

  const [operand3Type, setOperand3Type] = useState<Record<TabKey, 'markup' | 'step'>>({
    works: 'markup',
    materials: 'markup',
    subcontract_works: 'markup',
    subcontract_materials: 'markup',
    work_comp: 'markup',
    material_comp: 'markup',
  });

  const [operand3Value, setOperand3Value] = useState<Record<TabKey, string | number | undefined>>({
    works: undefined,
    materials: undefined,
    subcontract_works: undefined,
    subcontract_materials: undefined,
    work_comp: undefined,
    material_comp: undefined,
  });

  const [operand3MultiplyFormat, setOperand3MultiplyFormat] = useState<Record<TabKey, 'addOne' | 'direct'>>({
    works: 'addOne',
    materials: 'addOne',
    subcontract_works: 'addOne',
    subcontract_materials: 'addOne',
    work_comp: 'addOne',
    material_comp: 'addOne',
  });

  // Четвертая операция
  const [action4, setAction4] = useState<Record<TabKey, 'multiply' | 'divide' | 'add' | 'subtract'>>({
    works: 'multiply',
    materials: 'multiply',
    subcontract_works: 'multiply',
    subcontract_materials: 'multiply',
    work_comp: 'multiply',
    material_comp: 'multiply',
  });

  const [operand4Type, setOperand4Type] = useState<Record<TabKey, 'markup' | 'step'>>({
    works: 'markup',
    materials: 'markup',
    subcontract_works: 'markup',
    subcontract_materials: 'markup',
    work_comp: 'markup',
    material_comp: 'markup',
  });

  const [operand4Value, setOperand4Value] = useState<Record<TabKey, string | number | undefined>>({
    works: undefined,
    materials: undefined,
    subcontract_works: undefined,
    subcontract_materials: undefined,
    work_comp: undefined,
    material_comp: undefined,
  });

  const [operand4MultiplyFormat, setOperand4MultiplyFormat] = useState<Record<TabKey, 'addOne' | 'direct'>>({
    works: 'addOne',
    materials: 'addOne',
    subcontract_works: 'addOne',
    subcontract_materials: 'addOne',
    work_comp: 'addOne',
    material_comp: 'addOne',
  });

  // Пятая операция
  const [action5, setAction5] = useState<Record<TabKey, 'multiply' | 'divide' | 'add' | 'subtract'>>({
    works: 'multiply',
    materials: 'multiply',
    subcontract_works: 'multiply',
    subcontract_materials: 'multiply',
    work_comp: 'multiply',
    material_comp: 'multiply',
  });

  const [operand5Type, setOperand5Type] = useState<Record<TabKey, 'markup' | 'step'>>({
    works: 'markup',
    materials: 'markup',
    subcontract_works: 'markup',
    subcontract_materials: 'markup',
    work_comp: 'markup',
    material_comp: 'markup',
  });

  const [operand5Value, setOperand5Value] = useState<Record<TabKey, string | number | undefined>>({
    works: undefined,
    materials: undefined,
    subcontract_works: undefined,
    subcontract_materials: undefined,
    work_comp: undefined,
    material_comp: undefined,
  });

  const [operand5MultiplyFormat, setOperand5MultiplyFormat] = useState<Record<TabKey, 'addOne' | 'direct'>>({
    works: 'addOne',
    materials: 'addOne',
    subcontract_works: 'addOne',
    subcontract_materials: 'addOne',
    work_comp: 'addOne',
    material_comp: 'addOne',
  });

  // Видимость полей второго действия
  const [showSecondAction, setShowSecondAction] = useState<Record<TabKey, boolean>>({
    works: false,
    materials: false,
    subcontract_works: false,
    subcontract_materials: false,
    work_comp: false,
    material_comp: false,
  });

  // Видимость полей третьего действия
  const [showThirdAction, setShowThirdAction] = useState<Record<TabKey, boolean>>({
    works: false,
    materials: false,
    subcontract_works: false,
    subcontract_materials: false,
    work_comp: false,
    material_comp: false,
  });

  // Видимость полей четвертого действия
  const [showFourthAction, setShowFourthAction] = useState<Record<TabKey, boolean>>({
    works: false,
    materials: false,
    subcontract_works: false,
    subcontract_materials: false,
    work_comp: false,
    material_comp: false,
  });

  // Видимость полей пятого действия
  const [showFifthAction, setShowFifthAction] = useState<Record<TabKey, boolean>>({
    works: false,
    materials: false,
    subcontract_works: false,
    subcontract_materials: false,
    work_comp: false,
    material_comp: false,
  });

  // Названия пунктов
  const [stepName, setStepName] = useState<Record<TabKey, string>>({
    works: '',
    materials: '',
    subcontract_works: '',
    subcontract_materials: '',
    work_comp: '',
    material_comp: '',
  });

  // Загрузка существующей тактики из Supabase
  const fetchTacticFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('markup_tactics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Ошибка загрузки тактики из Supabase:', error);
        return null;
      }

      if (data) {
        console.log('Загружена тактика из Supabase:', data);
        setCurrentTacticId(data.id);

        // Преобразование из русского формата в английский
        const sequencesEn = {
          works: data.sequences['раб'] || [],
          materials: data.sequences['мат'] || [],
          subcontract_works: data.sequences['суб-раб'] || [],
          subcontract_materials: data.sequences['суб-мат'] || [],
          work_comp: data.sequences['раб-комп.'] || [],
          material_comp: data.sequences['мат-комп.'] || [],
        };

        const baseCostsEn = {
          works: data.base_costs['раб'] || 0,
          materials: data.base_costs['мат'] || 0,
          subcontract_works: data.base_costs['суб-раб'] || 0,
          subcontract_materials: data.base_costs['суб-мат'] || 0,
          work_comp: data.base_costs['раб-комп.'] || 0,
          material_comp: data.base_costs['мат-комп.'] || 0,
        };

        return { sequences: sequencesEn, baseCosts: baseCostsEn };
      }

      return null;
    } catch (error) {
      console.error('Ошибка при загрузке тактики:', error);
      return null;
    }
  };

  // Загрузка списка тендеров
  useEffect(() => {
    fetchTenders();
  }, []);

  // Загрузка и сохранение тактик наценок из localStorage и Supabase
  useEffect(() => {
    const loadData = async () => {
      // Сначала пытаемся загрузить из Supabase
      const tacticFromDb = await fetchTacticFromSupabase();

      if (tacticFromDb) {
        // Если есть данные в БД - используем их
        setMarkupSequences(tacticFromDb.sequences);
        setBaseCosts(tacticFromDb.baseCosts);
      } else {
        // Иначе загружаем из localStorage
        const savedSequences = localStorage.getItem('markupSequences');
        const savedBaseCosts = localStorage.getItem('markupBaseCosts');

        if (savedSequences) {
          try {
            const parsed = JSON.parse(savedSequences);
            console.log('Загружены тактики из localStorage:', parsed);
            setMarkupSequences(parsed);
          } catch (e) {
            console.error('Ошибка загрузки тактик наценок:', e);
            localStorage.removeItem('markupSequences');
          }
        }

        if (savedBaseCosts) {
          try {
            const parsed = JSON.parse(savedBaseCosts);
            console.log('Загружены базовые стоимости из localStorage:', parsed);
            setBaseCosts(parsed);
          } catch (e) {
            console.error('Ошибка загрузки базовых стоимостей:', e);
            localStorage.removeItem('markupBaseCosts');
          }
        }
      }

      // Устанавливаем флаг, что данные загружены
      setIsDataLoaded(true);
    };

    loadData();
  }, []);

  // Сохранение тактик наценок в localStorage при изменении
  useEffect(() => {
    if (!isDataLoaded) return; // Не сохраняем до первой загрузки данных
    console.log('Автосохранение тактик:', markupSequences);
    localStorage.setItem('markupSequences', JSON.stringify(markupSequences));
    localStorage.setItem('markupSequencesVersion', 'v2');
  }, [markupSequences, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return; // Не сохраняем до первой загрузки данных
    console.log('Автосохранение базовых стоимостей:', baseCosts);
    localStorage.setItem('markupBaseCosts', JSON.stringify(baseCosts));
  }, [baseCosts, isDataLoaded]);

  const fetchTenders = async () => {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenders(data || []);
    } catch (error) {
      console.error('Ошибка загрузки тендеров:', error);
      message.error('Не удалось загрузить список тендеров');
    }
  };

  // Загрузка данных наценок для выбранного тендера
  const fetchMarkupData = async (tenderId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tender_markup_percentage')
        .select('*')
        .eq('tender_id', tenderId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Данные найдены - заполняем форму
        setCurrentMarkupId(data.id);
        form.setFieldsValue({
          tender_id: tenderId,
          works_16_markup: data.works_16_markup || 0,
          works_cost_growth: data.works_cost_growth || 0,
          material_cost_growth: data.material_cost_growth || 0,
          subcontract_works_cost_growth: data.subcontract_works_cost_growth || 0,
          subcontract_materials_cost_growth: data.subcontract_materials_cost_growth || 0,
          contingency_costs: data.contingency_costs || 0,
          overhead_own_forces: data.overhead_own_forces || 0,
          overhead_subcontract: data.overhead_subcontract || 0,
          general_costs_without_subcontract: data.general_costs_without_subcontract || 0,
          profit_own_forces: data.profit_own_forces || 0,
          profit_subcontract: data.profit_subcontract || 0,
          mechanization_service: data.mechanization_service || 0,
          mbp_gsm: data.mbp_gsm || 0,
          warranty_period: data.warranty_period || 0,
        });
      } else {
        // Данных нет - сбрасываем форму с нулевыми значениями
        setCurrentMarkupId(null);
        form.setFieldsValue({
          tender_id: tenderId,
          works_16_markup: 0,
          works_cost_growth: 0,
          material_cost_growth: 0,
          subcontract_works_cost_growth: 0,
          subcontract_materials_cost_growth: 0,
          contingency_costs: 0,
          overhead_own_forces: 0,
          overhead_subcontract: 0,
          general_costs_without_subcontract: 0,
          profit_own_forces: 0,
          profit_subcontract: 0,
          mechanization_service: 0,
          mbp_gsm: 0,
          warranty_period: 0,
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки данных наценок:', error);
      message.error('Не удалось загрузить данные наценок');
    } finally {
      setLoading(false);
    }
  };

  // Обработка выбора тендера
  const handleTenderChange = (tenderId: string) => {
    setSelectedTenderId(tenderId);
    fetchMarkupData(tenderId);
  };

  // Сохранение данных
  const handleSave = async () => {
    if (!selectedTenderId) {
      message.warning('Выберите тендер');
      return;
    }

    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      setSaving(true);

      const markupData: TenderMarkupPercentageInsert = {
        tender_id: selectedTenderId,
        works_16_markup: values.works_16_markup || 0,
        works_cost_growth: values.works_cost_growth || 0,
        material_cost_growth: values.material_cost_growth || 0,
        subcontract_works_cost_growth: values.subcontract_works_cost_growth || 0,
        subcontract_materials_cost_growth: values.subcontract_materials_cost_growth || 0,
        contingency_costs: values.contingency_costs || 0,
        overhead_own_forces: values.overhead_own_forces || 0,
        overhead_subcontract: values.overhead_subcontract || 0,
        general_costs_without_subcontract: values.general_costs_without_subcontract || 0,
        profit_own_forces: values.profit_own_forces || 0,
        profit_subcontract: values.profit_subcontract || 0,
        mechanization_service: values.mechanization_service || 0,
        mbp_gsm: values.mbp_gsm || 0,
        warranty_period: values.warranty_period || 0,
        is_active: true,
      };

      if (currentMarkupId) {
        // Обновление существующей записи
        const { error } = await supabase
          .from('tender_markup_percentage')
          .update(markupData)
          .eq('id', currentMarkupId);

        if (error) throw error;
        message.success('Данные успешно обновлены');
      } else {
        // Создание новой записи
        const { data, error } = await supabase
          .from('tender_markup_percentage')
          .insert([markupData])
          .select()
          .single();

        if (error) throw error;
        setCurrentMarkupId(data.id);
        message.success('Данные успешно сохранены');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      message.error('Не удалось сохранить данные');
    } finally {
      setSaving(false);
    }
  };

  // Сброс формы
  const handleReset = () => {
    if (selectedTenderId) {
      fetchMarkupData(selectedTenderId);
    } else {
      form.resetFields();
    }
  };

  // Сохранение тактики наценок
  const handleSaveTactic = async () => {
    try {
      console.log('Сохранение тактики:', { markupSequences, baseCosts });

      // Сохранение в localStorage
      localStorage.setItem('markupSequences', JSON.stringify(markupSequences));
      localStorage.setItem('markupBaseCosts', JSON.stringify(baseCosts));
      localStorage.setItem('markupSequencesVersion', 'v2');

      // Преобразование из английского формата в русский для Supabase
      const sequencesRu = {
        'раб': markupSequences.works,
        'мат': markupSequences.materials,
        'суб-раб': markupSequences.subcontract_works,
        'суб-мат': markupSequences.subcontract_materials,
        'раб-комп.': markupSequences.work_comp,
        'мат-комп.': markupSequences.material_comp,
      };

      const baseCostsRu = {
        'раб': baseCosts.works,
        'мат': baseCosts.materials,
        'суб-раб': baseCosts.subcontract_works,
        'суб-мат': baseCosts.subcontract_materials,
        'раб-комп.': baseCosts.work_comp,
        'мат-комп.': baseCosts.material_comp,
      };

      // Сохранение в Supabase (RLS отключен до внедрения аутентификации)
      if (currentTacticId) {
        // Обновляем существующую запись
        const { data, error } = await supabase
          .from('markup_tactics')
          .update({
            name: 'Текущая тактика',
            sequences: sequencesRu,
            base_costs: baseCostsRu,
            is_global: false,
          })
          .eq('id', currentTacticId)
          .select()
          .single();

        if (error) {
          console.error('Ошибка обновления в Supabase:', error);
          message.warning('Тактика сохранена локально, но не удалось обновить в базе данных');
        } else {
          console.log('Тактика обновлена в Supabase:', data);
          message.success('Тактика наценок успешно обновлена');
        }
      } else {
        // Создаем новую запись
        const { data, error } = await supabase
          .from('markup_tactics')
          .insert({
            name: 'Текущая тактика',
            sequences: sequencesRu,
            base_costs: baseCostsRu,
            is_global: false,
          })
          .select()
          .single();

        if (error) {
          console.error('Ошибка сохранения в Supabase:', error);
          message.warning('Тактика сохранена локально, но не удалось сохранить в базу данных');
        } else {
          console.log('Тактика сохранена в Supabase:', data);
          setCurrentTacticId(data.id); // Сохраняем ID для последующих обновлений
          message.success('Тактика наценок успешно сохранена');
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения тактики:', error);
      message.error('Не удалось сохранить тактику');
    }
  };

  // Функции для управления порядком наценок
  const addMarkup = (tabKey: TabKey) => {
    const baseIdx = insertPositions[tabKey];
    const act1 = action1[tabKey];
    const op1Type = operand1Type[tabKey];
    const op1Value = operand1Value[tabKey];
    const act2 = action2[tabKey];
    const op2Type = operand2Type[tabKey];
    const op2Value = operand2Value[tabKey];
    const act3 = action3[tabKey];
    const op3Type = operand3Type[tabKey];
    const op3Value = operand3Value[tabKey];
    const act4 = action4[tabKey];
    const op4Type = operand4Type[tabKey];
    const op4Value = operand4Value[tabKey];
    const act5 = action5[tabKey];
    const op5Type = operand5Type[tabKey];
    const op5Value = operand5Value[tabKey];

    if (baseIdx === undefined || op1Value === undefined) {
      message.warning('Заполните обязательные поля');
      return;
    }

    const newStep: MarkupStep = {
      name: stepName[tabKey] || undefined,
      baseIndex: baseIdx,
      action1: act1,
      operand1Type: op1Type,
      operand1Key: op1Type === 'markup' ? String(op1Value) : (op1Type === 'number' ? Number(op1Value) : undefined),
      operand1Index: op1Type === 'step' ? Number(op1Value) : undefined,
      operand1MultiplyFormat: act1 === 'multiply' && op1Type === 'markup' ? operand1MultiplyFormat[tabKey] : undefined,
    };

    // Добавляем вторую операцию, если она заполнена
    if (op2Value !== undefined) {
      newStep.action2 = act2;
      newStep.operand2Type = op2Type;
      newStep.operand2Key = op2Type === 'markup' ? String(op2Value) : undefined;
      newStep.operand2Index = op2Type === 'step' ? Number(op2Value) : undefined;
      newStep.operand2MultiplyFormat = act2 === 'multiply' && op2Type === 'markup' ? operand2MultiplyFormat[tabKey] : undefined;
    }

    // Добавляем третью операцию, если она заполнена
    if (op3Value !== undefined) {
      newStep.action3 = act3;
      newStep.operand3Type = op3Type;
      newStep.operand3Key = op3Type === 'markup' ? String(op3Value) : undefined;
      newStep.operand3Index = op3Type === 'step' ? Number(op3Value) : undefined;
      newStep.operand3MultiplyFormat = act3 === 'multiply' && op3Type === 'markup' ? operand3MultiplyFormat[tabKey] : undefined;
    }

    // Добавляем четвертую операцию, если она заполнена
    if (op4Value !== undefined) {
      newStep.action4 = act4;
      newStep.operand4Type = op4Type;
      newStep.operand4Key = op4Type === 'markup' ? String(op4Value) : undefined;
      newStep.operand4Index = op4Type === 'step' ? Number(op4Value) : undefined;
      newStep.operand4MultiplyFormat = act4 === 'multiply' && op4Type === 'markup' ? operand4MultiplyFormat[tabKey] : undefined;
    }

    // Добавляем пятую операцию, если она заполнена
    if (op5Value !== undefined) {
      newStep.action5 = act5;
      newStep.operand5Type = op5Type;
      newStep.operand5Key = op5Type === 'markup' ? String(op5Value) : undefined;
      newStep.operand5Index = op5Type === 'step' ? Number(op5Value) : undefined;
      newStep.operand5MultiplyFormat = act5 === 'multiply' && op5Type === 'markup' ? operand5MultiplyFormat[tabKey] : undefined;
    }

    setMarkupSequences(prev => ({
      ...prev,
      [tabKey]: [...prev[tabKey], newStep]
    }));

    // Очищаем форму
    setOperand1Value(prev => ({ ...prev, [tabKey]: undefined }));
    setOperand2Value(prev => ({ ...prev, [tabKey]: undefined }));
    setOperand3Value(prev => ({ ...prev, [tabKey]: undefined }));
    setOperand4Value(prev => ({ ...prev, [tabKey]: undefined }));
    setOperand5Value(prev => ({ ...prev, [tabKey]: undefined }));
    setInsertPositions(prev => ({ ...prev, [tabKey]: undefined }));
    setStepName(prev => ({ ...prev, [tabKey]: '' }));
    setShowSecondAction(prev => ({ ...prev, [tabKey]: false }));
    setShowThirdAction(prev => ({ ...prev, [tabKey]: false }));
    setShowFourthAction(prev => ({ ...prev, [tabKey]: false }));
    setShowFifthAction(prev => ({ ...prev, [tabKey]: false }));
  };

  const removeMarkup = (tabKey: TabKey, index: number) => {
    setMarkupSequences(prev => ({
      ...prev,
      [tabKey]: prev[tabKey].filter((_, i) => i !== index)
    }));
  };

  const editMarkup = (tabKey: TabKey, index: number) => {
    const step = markupSequences[tabKey][index];

    // Загружаем данные в форму
    setStepName(prev => ({ ...prev, [tabKey]: step.name || '' }));
    setInsertPositions(prev => ({ ...prev, [tabKey]: step.baseIndex }));
    setAction1(prev => ({ ...prev, [tabKey]: step.action1 }));
    setOperand1Type(prev => ({ ...prev, [tabKey]: step.operand1Type }));
    setOperand1Value(prev => ({
      ...prev,
      [tabKey]: step.operand1Type === 'markup' ? step.operand1Key : (step.operand1Type === 'number' ? step.operand1Key : step.operand1Index)
    }));
    setOperand1InputMode(prev => ({
      ...prev,
      [tabKey]: step.operand1Type === 'number' ? 'manual' : 'select'
    }));
    setOperand1MultiplyFormat(prev => ({
      ...prev,
      [tabKey]: step.operand1MultiplyFormat || 'addOne'
    }));

    if (step.action2 && step.operand2Type) {
      setAction2(prev => ({ ...prev, [tabKey]: step.action2! }));
      setOperand2Type(prev => ({ ...prev, [tabKey]: step.operand2Type! }));
      setOperand2Value(prev => ({
        ...prev,
        [tabKey]: step.operand2Type === 'markup' ? step.operand2Key : step.operand2Index
      }));
      setOperand2MultiplyFormat(prev => ({
        ...prev,
        [tabKey]: step.operand2MultiplyFormat || 'addOne'
      }));
      setShowSecondAction(prev => ({ ...prev, [tabKey]: true }));
    } else {
      setOperand2Value(prev => ({ ...prev, [tabKey]: undefined }));
      setShowSecondAction(prev => ({ ...prev, [tabKey]: false }));
    }

    if (step.action3 && step.operand3Type) {
      setAction3(prev => ({ ...prev, [tabKey]: step.action3! }));
      setOperand3Type(prev => ({ ...prev, [tabKey]: step.operand3Type! }));
      setOperand3Value(prev => ({
        ...prev,
        [tabKey]: step.operand3Type === 'markup' ? step.operand3Key : step.operand3Index
      }));
      setOperand3MultiplyFormat(prev => ({
        ...prev,
        [tabKey]: step.operand3MultiplyFormat || 'addOne'
      }));
      setShowThirdAction(prev => ({ ...prev, [tabKey]: true }));
    } else {
      setOperand3Value(prev => ({ ...prev, [tabKey]: undefined }));
      setShowThirdAction(prev => ({ ...prev, [tabKey]: false }));
    }

    if (step.action4 && step.operand4Type) {
      setAction4(prev => ({ ...prev, [tabKey]: step.action4! }));
      setOperand4Type(prev => ({ ...prev, [tabKey]: step.operand4Type! }));
      setOperand4Value(prev => ({
        ...prev,
        [tabKey]: step.operand4Type === 'markup' ? step.operand4Key : step.operand4Index
      }));
      setOperand4MultiplyFormat(prev => ({
        ...prev,
        [tabKey]: step.operand4MultiplyFormat || 'addOne'
      }));
      setShowFourthAction(prev => ({ ...prev, [tabKey]: true }));
    } else {
      setOperand4Value(prev => ({ ...prev, [tabKey]: undefined }));
      setShowFourthAction(prev => ({ ...prev, [tabKey]: false }));
    }

    if (step.action5 && step.operand5Type) {
      setAction5(prev => ({ ...prev, [tabKey]: step.action5! }));
      setOperand5Type(prev => ({ ...prev, [tabKey]: step.operand5Type! }));
      setOperand5Value(prev => ({
        ...prev,
        [tabKey]: step.operand5Type === 'markup' ? step.operand5Key : step.operand5Index
      }));
      setOperand5MultiplyFormat(prev => ({
        ...prev,
        [tabKey]: step.operand5MultiplyFormat || 'addOne'
      }));
      setShowFifthAction(prev => ({ ...prev, [tabKey]: true }));
    } else {
      setOperand5Value(prev => ({ ...prev, [tabKey]: undefined }));
      setShowFifthAction(prev => ({ ...prev, [tabKey]: false }));
    }

    // Удаляем элемент из списка
    removeMarkup(tabKey, index);
  };

  const moveMarkupUp = (tabKey: TabKey, index: number) => {
    if (index === 0) return;
    setMarkupSequences(prev => {
      const newSequence = [...prev[tabKey]];
      [newSequence[index - 1], newSequence[index]] = [newSequence[index], newSequence[index - 1]];
      return { ...prev, [tabKey]: newSequence };
    });
  };

  const moveMarkupDown = (tabKey: TabKey, index: number) => {
    setMarkupSequences(prev => {
      if (index === prev[tabKey].length - 1) return prev;
      const newSequence = [...prev[tabKey]];
      [newSequence[index], newSequence[index + 1]] = [newSequence[index + 1], newSequence[index]];
      return { ...prev, [tabKey]: newSequence };
    });
  };

  // Получить все доступные наценки (без фильтрации)
  const getAvailableMarkups = (tabKey: TabKey) => {
    return AVAILABLE_MARKUPS;
  };

  // Расчет промежуточных итогов
  const calculateIntermediateResults = (tabKey: TabKey): number[] => {
    const sequence = markupSequences[tabKey];
    const baseCost = baseCosts[tabKey];
    const results: number[] = [];

    sequence.forEach((step) => {
      // Определяем базовую стоимость для этого шага
      let baseValue: number;
      if (step.baseIndex === -1) {
        baseValue = baseCost;
      } else {
        baseValue = results[step.baseIndex] || baseCost;
      }

      // Получаем значение первого операнда
      let operand1Value: number;
      if (step.operand1Type === 'markup' && step.operand1Key) {
        const percentValue = form.getFieldValue(step.operand1Key) || 0;
        operand1Value = percentValue / 100;
      } else if (step.operand1Type === 'step' && step.operand1Index !== undefined) {
        operand1Value = step.operand1Index === -1 ? baseCost : (results[step.operand1Index] || baseCost);
      } else if (step.operand1Type === 'number' && typeof step.operand1Key === 'number') {
        operand1Value = step.operand1Key;
      } else {
        operand1Value = 0;
      }

      // Применяем первую операцию
      let resultValue: number;
      switch (step.action1) {
        case 'multiply':
          if (step.operand1Type === 'markup') {
            // Если formат 'direct' - умножаем напрямую на процент, иначе на (1 + процент)
            const multiplyFormat = step.operand1MultiplyFormat || 'addOne';
            resultValue = multiplyFormat === 'direct'
              ? baseValue * operand1Value
              : baseValue * (1 + operand1Value);
          } else {
            resultValue = baseValue * operand1Value;
          }
          break;
        case 'divide':
          if (step.operand1Type === 'markup') {
            resultValue = baseValue / (1 + operand1Value);
          } else {
            resultValue = baseValue / operand1Value;
          }
          break;
        case 'add':
          if (step.operand1Type === 'markup') {
            resultValue = baseValue + (baseValue * operand1Value);
          } else {
            resultValue = baseValue + operand1Value;
          }
          break;
        case 'subtract':
          if (step.operand1Type === 'markup') {
            resultValue = baseValue - (baseValue * operand1Value);
          } else {
            resultValue = baseValue - operand1Value;
          }
          break;
        default:
          resultValue = baseValue;
      }

      // Применяем вторую операцию, если она есть
      if (step.action2 && step.operand2Type) {
        let operand2Value: number;
        if (step.operand2Type === 'markup' && step.operand2Key) {
          const percentValue = form.getFieldValue(step.operand2Key) || 0;
          operand2Value = percentValue / 100;
        } else if (step.operand2Type === 'step' && step.operand2Index !== undefined) {
          operand2Value = step.operand2Index === -1 ? baseCost : (results[step.operand2Index] || baseCost);
        } else {
          operand2Value = 0;
        }

        switch (step.action2) {
          case 'multiply':
            if (step.operand2Type === 'markup') {
              const multiplyFormat2 = step.operand2MultiplyFormat || 'addOne';
              resultValue = multiplyFormat2 === 'direct'
                ? resultValue * operand2Value
                : resultValue * (1 + operand2Value);
            } else {
              resultValue = resultValue * operand2Value;
            }
            break;
          case 'divide':
            if (step.operand2Type === 'markup') {
              resultValue = resultValue / (1 + operand2Value);
            } else {
              resultValue = resultValue / operand2Value;
            }
            break;
          case 'add':
            if (step.operand2Type === 'markup') {
              resultValue = resultValue + (resultValue * operand2Value);
            } else {
              resultValue = resultValue + operand2Value;
            }
            break;
          case 'subtract':
            if (step.operand2Type === 'markup') {
              resultValue = resultValue - (resultValue * operand2Value);
            } else {
              resultValue = resultValue - operand2Value;
            }
            break;
        }
      }

      // Применяем третью операцию, если она есть
      if (step.action3 && step.operand3Type) {
        let operand3Value: number;
        if (step.operand3Type === 'markup' && step.operand3Key) {
          const percentValue = form.getFieldValue(step.operand3Key) || 0;
          operand3Value = percentValue / 100;
        } else if (step.operand3Type === 'step' && step.operand3Index !== undefined) {
          operand3Value = step.operand3Index === -1 ? baseCost : (results[step.operand3Index] || baseCost);
        } else {
          operand3Value = 0;
        }

        switch (step.action3) {
          case 'multiply':
            if (step.operand3Type === 'markup') {
              const multiplyFormat3 = step.operand3MultiplyFormat || 'addOne';
              resultValue = multiplyFormat3 === 'direct'
                ? resultValue * operand3Value
                : resultValue * (1 + operand3Value);
            } else {
              resultValue = resultValue * operand3Value;
            }
            break;
          case 'divide':
            if (step.operand3Type === 'markup') {
              resultValue = resultValue / (1 + operand3Value);
            } else {
              resultValue = resultValue / operand3Value;
            }
            break;
          case 'add':
            if (step.operand3Type === 'markup') {
              resultValue = resultValue + (resultValue * operand3Value);
            } else {
              resultValue = resultValue + operand3Value;
            }
            break;
          case 'subtract':
            if (step.operand3Type === 'markup') {
              resultValue = resultValue - (resultValue * operand3Value);
            } else {
              resultValue = resultValue - operand3Value;
            }
            break;
        }
      }

      // Применяем четвертую операцию, если она есть
      if (step.action4 && step.operand4Type) {
        let operand4Value: number;
        if (step.operand4Type === 'markup' && step.operand4Key) {
          const percentValue = form.getFieldValue(step.operand4Key) || 0;
          operand4Value = percentValue / 100;
        } else if (step.operand4Type === 'step' && step.operand4Index !== undefined) {
          operand4Value = step.operand4Index === -1 ? baseCost : (results[step.operand4Index] || baseCost);
        } else {
          operand4Value = 0;
        }

        switch (step.action4) {
          case 'multiply':
            if (step.operand4Type === 'markup') {
              const multiplyFormat4 = step.operand4MultiplyFormat || 'addOne';
              resultValue = multiplyFormat4 === 'direct'
                ? resultValue * operand4Value
                : resultValue * (1 + operand4Value);
            } else {
              resultValue = resultValue * operand4Value;
            }
            break;
          case 'divide':
            if (step.operand4Type === 'markup') {
              resultValue = resultValue / (1 + operand4Value);
            } else {
              resultValue = resultValue / operand4Value;
            }
            break;
          case 'add':
            if (step.operand4Type === 'markup') {
              resultValue = resultValue + (resultValue * operand4Value);
            } else {
              resultValue = resultValue + operand4Value;
            }
            break;
          case 'subtract':
            if (step.operand4Type === 'markup') {
              resultValue = resultValue - (resultValue * operand4Value);
            } else {
              resultValue = resultValue - operand4Value;
            }
            break;
        }
      }

      // Применяем пятую операцию, если она есть
      if (step.action5 && step.operand5Type) {
        let operand5Value: number;
        if (step.operand5Type === 'markup' && step.operand5Key) {
          const percentValue = form.getFieldValue(step.operand5Key) || 0;
          operand5Value = percentValue / 100;
        } else if (step.operand5Type === 'step' && step.operand5Index !== undefined) {
          operand5Value = step.operand5Index === -1 ? baseCost : (results[step.operand5Index] || baseCost);
        } else {
          operand5Value = 0;
        }

        switch (step.action5) {
          case 'multiply':
            if (step.operand5Type === 'markup') {
              const multiplyFormat5 = step.operand5MultiplyFormat || 'addOne';
              resultValue = multiplyFormat5 === 'direct'
                ? resultValue * operand5Value
                : resultValue * (1 + operand5Value);
            } else {
              resultValue = resultValue * operand5Value;
            }
            break;
          case 'divide':
            if (step.operand5Type === 'markup') {
              resultValue = resultValue / (1 + operand5Value);
            } else {
              resultValue = resultValue / operand5Value;
            }
            break;
          case 'add':
            if (step.operand5Type === 'markup') {
              resultValue = resultValue + (resultValue * operand5Value);
            } else {
              resultValue = resultValue + operand5Value;
            }
            break;
          case 'subtract':
            if (step.operand5Type === 'markup') {
              resultValue = resultValue - (resultValue * operand5Value);
            } else {
              resultValue = resultValue - operand5Value;
            }
            break;
        }
      }

      results.push(resultValue);
    });

    return results;
  };

  // Рендер вкладки с порядком наценок
  const renderMarkupSequenceTab = (tabKey: TabKey) => {
    const sequence = markupSequences[tabKey];
    const availableMarkups = getAvailableMarkups(tabKey);
    const insertPosition = insertPositions[tabKey];
    const act1 = action1[tabKey];
    const op1Type = operand1Type[tabKey];
    const op1Value = operand1Value[tabKey];
    const act2 = action2[tabKey];
    const op2Type = operand2Type[tabKey];
    const op2Value = operand2Value[tabKey];

    // Получаем промежуточные результаты
    const intermediateResults = calculateIntermediateResults(tabKey);
    const finalResult = intermediateResults.length > 0 ? intermediateResults[intermediateResults.length - 1] : baseCosts[tabKey];

    // Опции для выбора базовой стоимости или пункта
    const baseOptions = [
      { label: 'Базовая стоимость', value: -1 }
    ];

    sequence.forEach((step, index) => {
      const intermediateValue = intermediateResults[index];
      const stepLabel = step.name
        ? `${step.name} (${intermediateValue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽)`
        : `Пункт ${index + 1} (${intermediateValue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽)`;
      baseOptions.push({
        label: stepLabel,
        value: index
      });
    });

    // Опции для выбора операндов (наценки или пункты) с группировкой
    const markupOptionsList = availableMarkups.map(markup => ({
      label: markup.label,
      value: `markup:${markup.key}`
    }));

    const stepOptionsList = sequence.map((step, index) => {
      const intermediateValue = intermediateResults[index];
      const stepLabel = step.name
        ? `${step.name} (${intermediateValue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽)`
        : `Пункт ${index + 1} (${intermediateValue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽)`;
      return {
        label: stepLabel,
        value: `step:${index}`
      };
    });

    const baseCostOptionsList = [{
      label: `Базовая стоимость (${baseCosts[tabKey].toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽)`,
      value: 'base:-1'
    }];

    const operandOptions = [
      {
        label: 'Наценки',
        options: markupOptionsList
      },
      {
        label: 'Базовая стоимость',
        options: baseCostOptionsList
      },
      ...(stepOptionsList.length > 0 ? [{
        label: 'Пункты',
        options: stepOptionsList
      }] : [])
    ];

    return (
      <div style={{ padding: '8px 0' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {/* Базовая стоимость */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: '4px' }}>Базовая (прямая) стоимость:</Text>
            <InputNumber
              value={baseCosts[tabKey]}
              onChange={(value) => setBaseCosts(prev => ({ ...prev, [tabKey]: value || 0 }))}
              style={{ width: '300px' }}
              min={0}
              step={0.01}
              precision={2}
              addonAfter="₽"
              placeholder="Введите базовую стоимость"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
              parser={(value) => value?.replace(/\s/g, '') || ''}
            />
          </div>

          <Divider style={{ margin: '0' }}>Порядок расчета</Divider>

          {/* Список наценок в порядке применения */}
          {sequence.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', color: token.colorTextTertiary }}>
              Наценки не добавлены. Используйте форму ниже для добавления наценок.
            </div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div style={{ padding: '12px 16px', background: token.colorFillQuaternary, borderRadius: '4px', fontWeight: 500, fontSize: '15px' }}>
                Базовая стоимость: <Text type="success">{baseCosts[tabKey].toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽</Text>
              </div>
              {sequence.map((step, index) => {
                const intermediateResult = intermediateResults[index];

                // Определяем базовую стоимость
                let baseValue: number;
                let baseName: string;
                if (step.baseIndex === -1) {
                  baseValue = baseCosts[tabKey];
                  baseName = 'Базовая';
                } else {
                  baseValue = intermediateResults[step.baseIndex] || baseCosts[tabKey];
                  baseName = `Пункт ${step.baseIndex + 1}`;
                }

                // Получаем первый операнд
                let op1Name: string;
                let op1ValueNum: number;
                if (step.operand1Type === 'markup' && step.operand1Key) {
                  const markup = AVAILABLE_MARKUPS.find(m => m.key === step.operand1Key);
                  op1Name = markup?.label || step.operand1Key;
                  op1ValueNum = form.getFieldValue(step.operand1Key) || 0;
                } else if (step.operand1Type === 'step' && step.operand1Index !== undefined) {
                  if (step.operand1Index === -1) {
                    op1Name = 'Базовая стоимость';
                    op1ValueNum = baseCosts[tabKey];
                  } else {
                    op1Name = `Пункт ${step.operand1Index + 1}`;
                    op1ValueNum = intermediateResults[step.operand1Index] || 0;
                  }
                } else if (step.operand1Type === 'number' && typeof step.operand1Key === 'number') {
                  op1Name = String(step.operand1Key);
                  op1ValueNum = step.operand1Key;
                } else {
                  op1Name = '?';
                  op1ValueNum = 0;
                }

                // Формируем формулу первой операции
                const action1Obj = ACTIONS.find(a => a.value === step.action1);
                let formula = `${baseName} ${action1Obj?.symbol} ${op1Name}`;
                if (step.operand1Type === 'markup') {
                  formula += ` (${op1ValueNum}%)`;
                }

                // Добавляем вторую операцию, если есть
                if (step.action2 && step.operand2Type) {
                  let op2Name: string;
                  let op2ValueNum: number;
                  if (step.operand2Type === 'markup' && step.operand2Key) {
                    const markup = AVAILABLE_MARKUPS.find(m => m.key === step.operand2Key);
                    op2Name = markup?.label || step.operand2Key;
                    op2ValueNum = form.getFieldValue(step.operand2Key) || 0;
                  } else if (step.operand2Type === 'step' && step.operand2Index !== undefined) {
                    if (step.operand2Index === -1) {
                      op2Name = 'Базовая стоимость';
                      op2ValueNum = baseCosts[tabKey];
                    } else {
                      op2Name = `Пункт ${step.operand2Index + 1}`;
                      op2ValueNum = intermediateResults[step.operand2Index] || 0;
                    }
                  } else {
                    op2Name = '?';
                    op2ValueNum = 0;
                  }

                  const action2Obj = ACTIONS.find(a => a.value === step.action2);
                  formula += ` ${action2Obj?.symbol} ${op2Name}`;
                  if (step.operand2Type === 'markup') {
                    formula += ` (${op2ValueNum}%)`;
                  }
                }

                // Добавляем третью операцию, если есть
                if (step.action3 && step.operand3Type) {
                  let op3Name: string;
                  let op3ValueNum: number;
                  if (step.operand3Type === 'markup' && step.operand3Key) {
                    const markup = AVAILABLE_MARKUPS.find(m => m.key === step.operand3Key);
                    op3Name = markup?.label || step.operand3Key;
                    op3ValueNum = form.getFieldValue(step.operand3Key) || 0;
                  } else if (step.operand3Type === 'step' && step.operand3Index !== undefined) {
                    if (step.operand3Index === -1) {
                      op3Name = 'Базовая стоимость';
                      op3ValueNum = baseCosts[tabKey];
                    } else {
                      op3Name = `Пункт ${step.operand3Index + 1}`;
                      op3ValueNum = intermediateResults[step.operand3Index] || 0;
                    }
                  } else {
                    op3Name = '?';
                    op3ValueNum = 0;
                  }

                  const action3Obj = ACTIONS.find(a => a.value === step.action3);
                  formula += ` ${action3Obj?.symbol} ${op3Name}`;
                  if (step.operand3Type === 'markup') {
                    formula += ` (${op3ValueNum}%)`;
                  }
                }

                // Добавляем четвертую операцию, если есть
                if (step.action4 && step.operand4Type) {
                  let op4Name: string;
                  let op4ValueNum: number;
                  if (step.operand4Type === 'markup' && step.operand4Key) {
                    const markup = AVAILABLE_MARKUPS.find(m => m.key === step.operand4Key);
                    op4Name = markup?.label || step.operand4Key;
                    op4ValueNum = form.getFieldValue(step.operand4Key) || 0;
                  } else if (step.operand4Type === 'step' && step.operand4Index !== undefined) {
                    if (step.operand4Index === -1) {
                      op4Name = 'Базовая стоимость';
                      op4ValueNum = baseCosts[tabKey];
                    } else {
                      op4Name = `Пункт ${step.operand4Index + 1}`;
                      op4ValueNum = intermediateResults[step.operand4Index] || 0;
                    }
                  } else {
                    op4Name = '?';
                    op4ValueNum = 0;
                  }

                  const action4Obj = ACTIONS.find(a => a.value === step.action4);
                  formula += ` ${action4Obj?.symbol} ${op4Name}`;
                  if (step.operand4Type === 'markup') {
                    formula += ` (${op4ValueNum}%)`;
                  }
                }

                // Добавляем пятую операцию, если есть
                if (step.action5 && step.operand5Type) {
                  let op5Name: string;
                  let op5ValueNum: number;
                  if (step.operand5Type === 'markup' && step.operand5Key) {
                    const markup = AVAILABLE_MARKUPS.find(m => m.key === step.operand5Key);
                    op5Name = markup?.label || step.operand5Key;
                    op5ValueNum = form.getFieldValue(step.operand5Key) || 0;
                  } else if (step.operand5Type === 'step' && step.operand5Index !== undefined) {
                    if (step.operand5Index === -1) {
                      op5Name = 'Базовая стоимость';
                      op5ValueNum = baseCosts[tabKey];
                    } else {
                      op5Name = `Пункт ${step.operand5Index + 1}`;
                      op5ValueNum = intermediateResults[step.operand5Index] || 0;
                    }
                  } else {
                    op5Name = '?';
                    op5ValueNum = 0;
                  }

                  const action5Obj = ACTIONS.find(a => a.value === step.action5);
                  formula += ` ${action5Obj?.symbol} ${op5Name}`;
                  if (step.operand5Type === 'markup') {
                    formula += ` (${op5ValueNum}%)`;
                  }
                }

                // Формируем детальную формулу с числами
                let detailedFormula = '';

                // Первая операция
                if (step.operand1Type === 'markup') {
                  const format1 = step.operand1MultiplyFormat || 'addOne';
                  if (step.action1 === 'multiply') {
                    const multiplier = format1 === 'addOne' ? (1 + (op1ValueNum / 100)) : (op1ValueNum / 100);
                    detailedFormula = `(${baseValue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${action1Obj?.symbol} ${Number(multiplier.toFixed(4))})`;
                  } else {
                    const multiplier = 1 + (op1ValueNum / 100);
                    detailedFormula = `(${baseValue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${action1Obj?.symbol} ${Number(multiplier.toFixed(4))})`;
                  }
                } else if (step.operand1Type === 'number') {
                  detailedFormula = `(${baseValue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${action1Obj?.symbol} ${op1ValueNum})`;
                } else {
                  detailedFormula = `(${baseValue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${action1Obj?.symbol} ${op1ValueNum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
                }

                // Вторая операция
                if (step.action2 && step.operand2Type) {
                  let op2Name: string;
                  let op2ValueNum: number;
                  if (step.operand2Type === 'markup' && step.operand2Key) {
                    op2ValueNum = form.getFieldValue(step.operand2Key) || 0;
                  } else if (step.operand2Type === 'step' && step.operand2Index !== undefined) {
                    op2ValueNum = step.operand2Index === -1 ? baseCosts[tabKey] : (intermediateResults[step.operand2Index] || 0);
                  } else {
                    op2ValueNum = 0;
                  }

                  const action2Obj = ACTIONS.find(a => a.value === step.action2);
                  if (step.operand2Type === 'markup') {
                    const format2 = step.operand2MultiplyFormat || 'addOne';
                    if (step.action2 === 'multiply') {
                      const multiplier = format2 === 'addOne' ? (1 + (op2ValueNum / 100)) : (op2ValueNum / 100);
                      detailedFormula += ` ${action2Obj?.symbol} ${Number(multiplier.toFixed(4))}`;
                    } else {
                      const multiplier = 1 + (op2ValueNum / 100);
                      detailedFormula += ` ${action2Obj?.symbol} ${Number(multiplier.toFixed(4))}`;
                    }
                  } else {
                    detailedFormula += ` ${action2Obj?.symbol} ${op2ValueNum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  }
                }

                // Третья операция
                if (step.action3 && step.operand3Type) {
                  let op3ValueNum: number;
                  if (step.operand3Type === 'markup' && step.operand3Key) {
                    op3ValueNum = form.getFieldValue(step.operand3Key) || 0;
                  } else if (step.operand3Type === 'step' && step.operand3Index !== undefined) {
                    op3ValueNum = step.operand3Index === -1 ? baseCosts[tabKey] : (intermediateResults[step.operand3Index] || 0);
                  } else {
                    op3ValueNum = 0;
                  }

                  const action3Obj = ACTIONS.find(a => a.value === step.action3);
                  if (step.operand3Type === 'markup') {
                    const format3 = step.operand3MultiplyFormat || 'addOne';
                    if (step.action3 === 'multiply') {
                      const multiplier = format3 === 'addOne' ? (1 + (op3ValueNum / 100)) : (op3ValueNum / 100);
                      detailedFormula += ` ${action3Obj?.symbol} ${Number(multiplier.toFixed(4))}`;
                    } else {
                      const multiplier = 1 + (op3ValueNum / 100);
                      detailedFormula += ` ${action3Obj?.symbol} ${Number(multiplier.toFixed(4))}`;
                    }
                  } else {
                    detailedFormula += ` ${action3Obj?.symbol} ${op3ValueNum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  }
                }

                // Четвертая операция
                if (step.action4 && step.operand4Type) {
                  let op4ValueNum: number;
                  if (step.operand4Type === 'markup' && step.operand4Key) {
                    op4ValueNum = form.getFieldValue(step.operand4Key) || 0;
                  } else if (step.operand4Type === 'step' && step.operand4Index !== undefined) {
                    op4ValueNum = step.operand4Index === -1 ? baseCosts[tabKey] : (intermediateResults[step.operand4Index] || 0);
                  } else {
                    op4ValueNum = 0;
                  }

                  const action4Obj = ACTIONS.find(a => a.value === step.action4);
                  if (step.operand4Type === 'markup') {
                    const format4 = step.operand4MultiplyFormat || 'addOne';
                    if (step.action4 === 'multiply') {
                      const multiplier = format4 === 'addOne' ? (1 + (op4ValueNum / 100)) : (op4ValueNum / 100);
                      detailedFormula += ` ${action4Obj?.symbol} ${Number(multiplier.toFixed(4))}`;
                    } else {
                      const multiplier = 1 + (op4ValueNum / 100);
                      detailedFormula += ` ${action4Obj?.symbol} ${Number(multiplier.toFixed(4))}`;
                    }
                  } else {
                    detailedFormula += ` ${action4Obj?.symbol} ${op4ValueNum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  }
                }

                // Пятая операция
                if (step.action5 && step.operand5Type) {
                  let op5ValueNum: number;
                  if (step.operand5Type === 'markup' && step.operand5Key) {
                    op5ValueNum = form.getFieldValue(step.operand5Key) || 0;
                  } else if (step.operand5Type === 'step' && step.operand5Index !== undefined) {
                    op5ValueNum = step.operand5Index === -1 ? baseCosts[tabKey] : (intermediateResults[step.operand5Index] || 0);
                  } else {
                    op5ValueNum = 0;
                  }

                  const action5Obj = ACTIONS.find(a => a.value === step.action5);
                  if (step.operand5Type === 'markup') {
                    const format5 = step.operand5MultiplyFormat || 'addOne';
                    if (step.action5 === 'multiply') {
                      const multiplier = format5 === 'addOne' ? (1 + (op5ValueNum / 100)) : (op5ValueNum / 100);
                      detailedFormula += ` ${action5Obj?.symbol} ${Number(multiplier.toFixed(4))}`;
                    } else {
                      const multiplier = 1 + (op5ValueNum / 100);
                      detailedFormula += ` ${action5Obj?.symbol} ${Number(multiplier.toFixed(4))}`;
                    }
                  } else {
                    detailedFormula += ` ${action5Obj?.symbol} ${op5ValueNum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  }
                }

                return (
                  <div
                    key={`${index}`}
                    style={{
                      padding: '8px 12px',
                      background: token.colorBgContainer,
                      border: `1px solid ${token.colorBorder}`,
                      borderRadius: '4px',
                      marginBottom: '4px'
                    }}
                  >
                    <Row gutter={[16, 8]} align="middle">
                      <Col flex="auto">
                        <Space direction="vertical" size={0}>
                          <Space>
                            <Tag color="blue">{index + 1}</Tag>
                            {step.name && <Tag color="green">{step.name}</Tag>}
                            <Text type="secondary" style={{ fontSize: '13px' }}>
                              {formula}
                            </Text>
                            <Text strong style={{ color: token.colorInfo }}>
                              → {intermediateResult.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                            </Text>
                          </Space>
                          <Text type="secondary" style={{ fontSize: '12px', marginLeft: '32px' }}>
                            {detailedFormula}
                          </Text>
                        </Space>
                      </Col>
                      <Col flex="none">
                        <Space>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => editMarkup(tabKey, index)}
                            title="Редактировать"
                          />
                          <Button
                            size="small"
                            icon={<ArrowUpOutlined />}
                            onClick={() => moveMarkupUp(tabKey, index)}
                            disabled={index === 0}
                          />
                          <Button
                            size="small"
                            icon={<ArrowDownOutlined />}
                            onClick={() => moveMarkupDown(tabKey, index)}
                            disabled={index === sequence.length - 1}
                          />
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeMarkup(tabKey, index)}
                          />
                        </Space>
                      </Col>
                    </Row>
                  </div>
                );
              })}
              <div style={{ padding: '12px 16px', background: token.colorInfoBg, borderRadius: '4px', fontWeight: 500, color: token.colorInfo, fontSize: '15px' }}>
                → Коммерческая стоимость: <Text strong style={{ color: token.colorInfo }}>{finalResult.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽</Text>
              </div>
            </Space>
          )}

          <Divider style={{ margin: '8px 0' }}>Добавить наценку</Divider>

          {/* Добавление наценки */}
          <Space direction="vertical" style={{ width: '100%' }} size={24}>
            {/* Поле 1: Название (компактное, выровнено с полем База) */}
            <Row gutter={[8, 0]} align="middle" style={{ marginBottom: 12 }}>
              <Col flex="none" style={{ width: 80 }}>
                <span style={{ fontSize: 13, color: '#888' }}>Название:</span>
              </Col>
              <Col flex="auto" style={{ maxWidth: 320 }}>
                <Input
                  placeholder="Название пункта"
                  value={stepName[tabKey]}
                  onChange={(e) => setStepName(prev => ({ ...prev, [tabKey]: e.target.value }))}
                  allowClear
                  size="small"
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>

            {/* Секция базы */}
            <Row gutter={[8, 0]} align="middle" style={{ marginBottom: 12 }}>
              <Col flex="none" style={{ width: 80 }}>
                <span style={{ fontSize: 13, color: '#888' }}>База:</span>
              </Col>
              <Col flex="auto" style={{ maxWidth: 320 }}>
                <Select
                  placeholder="Выберите базу для расчета"
                  style={{ width: '100%' }}
                  options={baseOptions}
                  onChange={(value) => setInsertPositions(prev => ({ ...prev, [tabKey]: value }))}
                  value={insertPosition}
                  size="middle"
                />
              </Col>
            </Row>

            {/* Секция операций */}
            <div style={{ maxWidth: 460 }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: 6,
                padding: '16px'
              }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#10b981',
                  marginBottom: 16
                }}>
                  Операции
                </div>

                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                {/* Операция 1 (обязательная) */}
                <div style={{ marginBottom: 0 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Radio.Group
                      size="small"
                      value={operand1InputMode[tabKey]}
                      onChange={(e) => {
                        setOperand1InputMode(prev => ({ ...prev, [tabKey]: e.target.value }));
                        if (e.target.value === 'manual') {
                          setOperand1Type(prev => ({ ...prev, [tabKey]: 'number' }));
                          setOperand1Value(prev => ({ ...prev, [tabKey]: undefined }));
                        } else {
                          setOperand1Type(prev => ({ ...prev, [tabKey]: 'markup' }));
                          setOperand1Value(prev => ({ ...prev, [tabKey]: undefined }));
                        }
                      }}
                    >
                      <Radio.Button value="select">Выбрать</Radio.Button>
                      <Radio.Button value="manual">Ввести число</Radio.Button>
                    </Radio.Group>
                  </div>

                  <Row gutter={8} align="middle" style={{ marginBottom: 0 }}>
                    <Col flex="120px">
                      <Select
                        placeholder="Действие"
                        style={{ width: '100%' }}
                        options={ACTIONS.map(a => ({ label: a.label, value: a.value }))}
                        onChange={(value) => setAction1(prev => ({ ...prev, [tabKey]: value }))}
                        value={act1}
                        size="middle"
                      />
                    </Col>
                    <Col flex="auto" style={{ maxWidth: 250 }}>
                      {operand1InputMode[tabKey] === 'select' ? (
                        <Select
                          placeholder="Наценка/Пункт"
                          style={{ width: '100%' }}
                          options={operandOptions}
                          onChange={(value) => {
                            const [type, val] = value.split(':');
                            if (type === 'base') {
                              setOperand1Type(prev => ({ ...prev, [tabKey]: 'step' }));
                              setOperand1Value(prev => ({ ...prev, [tabKey]: -1 }));
                            } else {
                              setOperand1Type(prev => ({ ...prev, [tabKey]: type as 'markup' | 'step' | 'number' }));
                              setOperand1Value(prev => ({ ...prev, [tabKey]: type === 'markup' ? val : Number(val) }));
                            }
                          }}
                          value={op1Value !== undefined && op1Type !== 'number' ? (op1Value === -1 ? 'base:-1' : `${op1Type}:${op1Value}`) : undefined}
                          size="middle"
                        />
                      ) : (
                        <InputNumber
                          placeholder="Введите число"
                          style={{ width: '100%' }}
                          value={typeof op1Value === 'number' ? op1Value : undefined}
                          onChange={(value) => {
                            setOperand1Value(prev => ({ ...prev, [tabKey]: value || 0 }));
                          }}
                          size="middle"
                        />
                      )}
                    </Col>
                    <Col flex="none">
                      {!showSecondAction[tabKey] && (
                        <Button
                          icon={<PlusOutlined />}
                          onClick={() => setShowSecondAction(prev => ({ ...prev, [tabKey]: true }))}
                          title="Добавить второе действие"
                          size="middle"
                          style={{ minWidth: 32, padding: '4px 8px' }}
                        />
                      )}
                    </Col>
                  </Row>
                </div>
                {act1 === 'multiply' && op1Type === 'markup' && (
                  <Row style={{ marginBottom: showSecondAction[tabKey] ? 12 : 0, marginTop: 8, marginLeft: 128 }}>
                    <Col>
                      <Radio.Group
                        size="small"
                        value={operand1MultiplyFormat[tabKey]}
                        onChange={(e) => setOperand1MultiplyFormat(prev => ({ ...prev, [tabKey]: e.target.value }))}
                      >
                        <Radio.Button value="addOne">1 + %</Radio.Button>
                        <Radio.Button value="direct">%</Radio.Button>
                      </Radio.Group>
                    </Col>
                  </Row>
                )}
                {!(act1 === 'multiply' && op1Type === 'markup') && (
                  <div style={{ marginBottom: showSecondAction[tabKey] ? 12 : 0 }} />
                )}

                {/* Операция 2 (опциональная) */}
                {showSecondAction[tabKey] && (
                  <>
                    <Row gutter={8} align="middle" style={{ marginBottom: 0 }}>
                      <Col flex="120px">
                        <Select
                          placeholder="Действие"
                          style={{ width: '100%' }}
                          options={ACTIONS.map(a => ({ label: a.label, value: a.value }))}
                          onChange={(value) => setAction2(prev => ({ ...prev, [tabKey]: value }))}
                          value={act2}
                          size="middle"
                        />
                      </Col>
                      <Col flex="auto" style={{ maxWidth: 250 }}>
                        <Select
                          placeholder="Наценка/Пункт"
                          style={{ width: '100%' }}
                          options={operandOptions}
                          onChange={(value) => {
                            if (value) {
                              const [type, val] = value.split(':');
                              if (type === 'base') {
                                setOperand2Type(prev => ({ ...prev, [tabKey]: 'step' }));
                                setOperand2Value(prev => ({ ...prev, [tabKey]: -1 }));
                              } else {
                                setOperand2Type(prev => ({ ...prev, [tabKey]: type as 'markup' | 'step' }));
                                setOperand2Value(prev => ({ ...prev, [tabKey]: type === 'markup' ? val : Number(val) }));
                              }
                            } else {
                              setOperand2Value(prev => ({ ...prev, [tabKey]: undefined }));
                            }
                          }}
                          value={op2Value !== undefined ? (op2Value === -1 ? 'base:-1' : `${op2Type}:${op2Value}`) : undefined}
                          allowClear
                          onClear={() => {
                            setShowSecondAction(prev => ({ ...prev, [tabKey]: false }));
                            setShowThirdAction(prev => ({ ...prev, [tabKey]: false }));
                            setShowFourthAction(prev => ({ ...prev, [tabKey]: false }));
                            setShowFifthAction(prev => ({ ...prev, [tabKey]: false }));
                            setOperand2Value(prev => ({ ...prev, [tabKey]: undefined }));
                          }}
                          size="middle"
                        />
                      </Col>
                      <Col flex="none">
                        {!showThirdAction[tabKey] && (
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() => setShowThirdAction(prev => ({ ...prev, [tabKey]: true }))}
                            title="Добавить третье действие"
                            size="middle"
                            style={{ minWidth: 32, padding: '4px 8px' }}
                          />
                        )}
                      </Col>
                    </Row>
                    {act2 === 'multiply' && op2Type === 'markup' && (
                      <Row style={{ marginBottom: showThirdAction[tabKey] ? 12 : 0, marginTop: 8, marginLeft: 128 }}>
                        <Col>
                          <Radio.Group
                            size="small"
                            value={operand2MultiplyFormat[tabKey]}
                            onChange={(e) => setOperand2MultiplyFormat(prev => ({ ...prev, [tabKey]: e.target.value }))}
                          >
                            <Radio.Button value="addOne">1 + %</Radio.Button>
                            <Radio.Button value="direct">%</Radio.Button>
                          </Radio.Group>
                        </Col>
                      </Row>
                    )}
                    {!(act2 === 'multiply' && op2Type === 'markup') && (
                      <div style={{ marginBottom: showThirdAction[tabKey] ? 12 : 0 }} />
                    )}
                  </>
                )}

                {/* Операция 3 (опциональная) */}
                {showThirdAction[tabKey] && (
                  <>
                    <Row gutter={8} align="middle" style={{ marginBottom: 0 }}>
                      <Col flex="120px">
                        <Select
                          placeholder="Действие"
                          style={{ width: '100%' }}
                          options={ACTIONS.map(a => ({ label: a.label, value: a.value }))}
                          onChange={(value) => setAction3(prev => ({ ...prev, [tabKey]: value }))}
                          value={action3[tabKey]}
                          size="middle"
                        />
                      </Col>
                      <Col flex="auto" style={{ maxWidth: 250 }}>
                        <Select
                          placeholder="Наценка/Пункт"
                          style={{ width: '100%' }}
                          options={operandOptions}
                          onChange={(value) => {
                            if (value) {
                              const [type, val] = value.split(':');
                              if (type === 'base') {
                                setOperand3Type(prev => ({ ...prev, [tabKey]: 'step' }));
                                setOperand3Value(prev => ({ ...prev, [tabKey]: -1 }));
                              } else {
                                setOperand3Type(prev => ({ ...prev, [tabKey]: type as 'markup' | 'step' }));
                                setOperand3Value(prev => ({ ...prev, [tabKey]: type === 'markup' ? val : Number(val) }));
                              }
                            } else {
                              setOperand3Value(prev => ({ ...prev, [tabKey]: undefined }));
                            }
                          }}
                          value={operand3Value[tabKey] !== undefined ? (operand3Value[tabKey] === -1 ? 'base:-1' : `${operand3Type[tabKey]}:${operand3Value[tabKey]}`) : undefined}
                          allowClear
                          onClear={() => {
                            setShowThirdAction(prev => ({ ...prev, [tabKey]: false }));
                            setShowFourthAction(prev => ({ ...prev, [tabKey]: false }));
                            setShowFifthAction(prev => ({ ...prev, [tabKey]: false }));
                            setOperand3Value(prev => ({ ...prev, [tabKey]: undefined }));
                          }}
                          size="middle"
                        />
                      </Col>
                      <Col flex="none">
                        {!showFourthAction[tabKey] && (
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() => setShowFourthAction(prev => ({ ...prev, [tabKey]: true }))}
                            title="Добавить четвертое действие"
                            size="middle"
                            style={{ minWidth: 32, padding: '4px 8px' }}
                          />
                        )}
                      </Col>
                    </Row>
                    {action3[tabKey] === 'multiply' && operand3Type[tabKey] === 'markup' && (
                      <Row style={{ marginBottom: showFourthAction[tabKey] ? 12 : 0, marginTop: 8, marginLeft: 128 }}>
                        <Col>
                          <Radio.Group
                            size="small"
                            value={operand3MultiplyFormat[tabKey]}
                            onChange={(e) => setOperand3MultiplyFormat(prev => ({ ...prev, [tabKey]: e.target.value }))}
                          >
                            <Radio.Button value="addOne">1 + %</Radio.Button>
                            <Radio.Button value="direct">%</Radio.Button>
                          </Radio.Group>
                        </Col>
                      </Row>
                    )}
                    {!(action3[tabKey] === 'multiply' && operand3Type[tabKey] === 'markup') && (
                      <div style={{ marginBottom: showFourthAction[tabKey] ? 12 : 0 }} />
                    )}
                  </>
                )}

                {/* Операция 4 (опциональная) */}
                {showFourthAction[tabKey] && (
                  <>
                    <Row gutter={8} align="middle" style={{ marginBottom: 0 }}>
                      <Col flex="120px">
                        <Select
                          placeholder="Действие"
                          style={{ width: '100%' }}
                          options={ACTIONS.map(a => ({ label: a.label, value: a.value }))}
                          onChange={(value) => setAction4(prev => ({ ...prev, [tabKey]: value }))}
                          value={action4[tabKey]}
                          size="middle"
                        />
                      </Col>
                      <Col flex="auto" style={{ maxWidth: 250 }}>
                        <Select
                          placeholder="Наценка/Пункт"
                          style={{ width: '100%' }}
                          options={operandOptions}
                          onChange={(value) => {
                            if (value) {
                              const [type, val] = value.split(':');
                              if (type === 'base') {
                                setOperand4Type(prev => ({ ...prev, [tabKey]: 'step' }));
                                setOperand4Value(prev => ({ ...prev, [tabKey]: -1 }));
                              } else {
                                setOperand4Type(prev => ({ ...prev, [tabKey]: type as 'markup' | 'step' }));
                                setOperand4Value(prev => ({ ...prev, [tabKey]: type === 'markup' ? val : Number(val) }));
                              }
                            } else {
                              setOperand4Value(prev => ({ ...prev, [tabKey]: undefined }));
                            }
                          }}
                          value={operand4Value[tabKey] !== undefined ? (operand4Value[tabKey] === -1 ? 'base:-1' : `${operand4Type[tabKey]}:${operand4Value[tabKey]}`) : undefined}
                          allowClear
                          onClear={() => {
                            setShowFourthAction(prev => ({ ...prev, [tabKey]: false }));
                            setShowFifthAction(prev => ({ ...prev, [tabKey]: false }));
                            setOperand4Value(prev => ({ ...prev, [tabKey]: undefined }));
                          }}
                          size="middle"
                        />
                      </Col>
                      <Col flex="none">
                        {!showFifthAction[tabKey] && (
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() => setShowFifthAction(prev => ({ ...prev, [tabKey]: true }))}
                            title="Добавить пятое действие"
                            size="middle"
                            style={{ minWidth: 32, padding: '4px 8px' }}
                          />
                        )}
                      </Col>
                    </Row>
                    {action4[tabKey] === 'multiply' && operand4Type[tabKey] === 'markup' && (
                      <Row style={{ marginBottom: showFifthAction[tabKey] ? 12 : 0, marginTop: 8, marginLeft: 128 }}>
                        <Col>
                          <Radio.Group
                            size="small"
                            value={operand4MultiplyFormat[tabKey]}
                            onChange={(e) => setOperand4MultiplyFormat(prev => ({ ...prev, [tabKey]: e.target.value }))}
                          >
                            <Radio.Button value="addOne">1 + %</Radio.Button>
                            <Radio.Button value="direct">%</Radio.Button>
                          </Radio.Group>
                        </Col>
                      </Row>
                    )}
                    {!(action4[tabKey] === 'multiply' && operand4Type[tabKey] === 'markup') && (
                      <div style={{ marginBottom: showFifthAction[tabKey] ? 12 : 0 }} />
                    )}
                  </>
                )}

                {/* Операция 5 (опциональная) */}
                {showFifthAction[tabKey] && (
                  <>
                    <Row gutter={8} align="middle">
                      <Col flex="120px">
                        <Select
                          placeholder="Действие"
                          style={{ width: '100%' }}
                          options={ACTIONS.map(a => ({ label: a.label, value: a.value }))}
                          onChange={(value) => setAction5(prev => ({ ...prev, [tabKey]: value }))}
                          value={action5[tabKey]}
                          size="middle"
                        />
                      </Col>
                      <Col flex="auto" style={{ maxWidth: 250 }}>
                        <Select
                          placeholder="Наценка/Пункт"
                          style={{ width: '100%' }}
                          options={operandOptions}
                          onChange={(value) => {
                            if (value) {
                              const [type, val] = value.split(':');
                              if (type === 'base') {
                                setOperand5Type(prev => ({ ...prev, [tabKey]: 'step' }));
                                setOperand5Value(prev => ({ ...prev, [tabKey]: -1 }));
                              } else {
                                setOperand5Type(prev => ({ ...prev, [tabKey]: type as 'markup' | 'step' }));
                                setOperand5Value(prev => ({ ...prev, [tabKey]: type === 'markup' ? val : Number(val) }));
                              }
                            } else {
                              setOperand5Value(prev => ({ ...prev, [tabKey]: undefined }));
                            }
                          }}
                          value={operand5Value[tabKey] !== undefined ? (operand5Value[tabKey] === -1 ? 'base:-1' : `${operand5Type[tabKey]}:${operand5Value[tabKey]}`) : undefined}
                          allowClear
                          onClear={() => {
                            setShowFifthAction(prev => ({ ...prev, [tabKey]: false }));
                            setOperand5Value(prev => ({ ...prev, [tabKey]: undefined }));
                          }}
                          size="middle"
                        />
                      </Col>
                    </Row>
                    {action5[tabKey] === 'multiply' && operand5Type[tabKey] === 'markup' && (
                      <Row style={{ marginTop: 8, marginLeft: 128 }}>
                        <Col>
                          <Radio.Group
                            size="small"
                            value={operand5MultiplyFormat[tabKey]}
                            onChange={(e) => setOperand5MultiplyFormat(prev => ({ ...prev, [tabKey]: e.target.value }))}
                          >
                            <Radio.Button value="addOne">1 + %</Radio.Button>
                            <Radio.Button value="direct">%</Radio.Button>
                          </Radio.Group>
                        </Col>
                      </Row>
                    )}
                  </>
                )}
              </Space>
              </div>

              {/* Кнопка добавить (под зеленым блоком) */}
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={insertPosition === undefined || op1Value === undefined}
                  onClick={() => addMarkup(tabKey)}
                  size="middle"
                >
                  Добавить
                </Button>
              </div>
            </div>
          </Space>
        </Space>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100%', overflow: 'visible' }} className="markup-constructor">
      <Tabs
        defaultActiveKey="percentages"
        items={[
          {
            key: 'percentages',
            label: 'Проценты наценок',
            children: (
              <Card
                title={
                  <Space direction="vertical" size={0}>
                    <Title level={4} style={{ margin: 0 }}>
                      Проценты наценок
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      Задайте значения процентов
                    </Text>
                  </Space>
                }
                extra={
                  <Space>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={handleReset}
                      disabled={!selectedTenderId}
                    >
                      Сбросить
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSave}
                      loading={saving}
                      disabled={!selectedTenderId}
                    >
                      Сохранить
                    </Button>
                  </Space>
                }
              >
            <Spin spinning={loading}>
              <Form
                form={form}
                layout="horizontal"
                labelCol={{ style: { width: '250px', textAlign: 'left' } }}
                wrapperCol={{ style: { flex: 1 } }}
                initialValues={{
                  works_16_markup: 0,
                  works_cost_growth: 0,
                  material_cost_growth: 0,
                  subcontract_works_cost_growth: 0,
                  subcontract_materials_cost_growth: 0,
                  contingency_costs: 0,
                  overhead_own_forces: 0,
                  overhead_subcontract: 0,
                  general_costs_without_subcontract: 0,
                  profit_own_forces: 0,
                  profit_subcontract: 0,
                  mechanization_service: 0,
                  mbp_gsm: 0,
                  warranty_period: 0,
                }}
              >
              {/* Выбор тендера */}
              <Form.Item
                label="Тендер"
                name="tender_id"
                rules={[{ required: true, message: 'Выберите тендер' }]}
                style={{ marginBottom: '24px' }}
              >
                <Select
                  placeholder="Выберите тендер"
                  onChange={handleTenderChange}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={tenders.map(tender => ({
                    label: tender.title,
                    value: tender.id,
                  }))}
                  style={{ width: '250px' }}
                />
              </Form.Item>

              <Row gutter={[16, 0]}>
                <Col span={24}>
                  <Form.Item
                    label="Служба механизации"
                    name="mechanization_service"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="МБП и ГСМ"
                    name="mbp_gsm"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Гарантийный период"
                    name="warranty_period"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Работы 1,6"
                    name="works_16_markup"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Рост стоимости работ"
                    name="works_cost_growth"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Рост стоимости материалов"
                    name="material_cost_growth"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Рост стоимости работ субподряда"
                    name="subcontract_works_cost_growth"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Рост стоимости материалов субподряда"
                    name="subcontract_materials_cost_growth"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Непредвиденные затраты"
                    name="contingency_costs"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="ООЗ"
                    name="overhead_own_forces"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="ООЗ субподряда"
                    name="overhead_subcontract"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="ОФЗ без субподряда"
                    name="general_costs_without_subcontract"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Прибыль"
                    name="profit_own_forces"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Прибыль субподряда"
                    name="profit_subcontract"
                    style={{ marginBottom: '4px' }}
                  >
                    <InputNumber
                      min={0}
                      max={999.99}
                      step={0.01}
                      addonAfter="%"
                      style={{ width: '120px' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
                </Form>
              </Spin>
              </Card>
            ),
          },
          {
            key: 'tactics',
            label: 'Порядок применения наценок',
            children: (
              <div style={{ minHeight: '100%', overflow: 'visible' }}>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>
                      Порядок применения наценок
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      Настройте последовательность расчета для каждого типа позиций
                    </Text>
                  </div>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveTactic}
                  >
                    Сохранить тактику
                  </Button>
                </div>
                <Tabs
                  activeKey={activeTab}
                  onChange={(key) => setActiveTab(key as TabKey)}
                  style={{ overflow: 'visible', marginTop: '-8px' }}
                  items={[
                    {
                      key: 'works',
                      label: 'Работы',
                      children: renderMarkupSequenceTab('works'),
                    },
                    {
                      key: 'materials',
                      label: 'Материалы',
                      children: renderMarkupSequenceTab('materials'),
                    },
                    {
                      key: 'subcontract_works',
                      label: 'Субподрядные работы',
                      children: renderMarkupSequenceTab('subcontract_works'),
                    },
                    {
                      key: 'subcontract_materials',
                      label: 'Субподрядные материалы',
                      children: renderMarkupSequenceTab('subcontract_materials'),
                    },
                    {
                      key: 'work_comp',
                      label: 'Раб-комп',
                      children: renderMarkupSequenceTab('work_comp'),
                    },
                    {
                      key: 'material_comp',
                      label: 'Мат-комп',
                      children: renderMarkupSequenceTab('material_comp'),
                    },
                  ]}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default MarkupConstructor;
