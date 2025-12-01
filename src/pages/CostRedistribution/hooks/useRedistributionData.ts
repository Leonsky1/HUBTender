/**
 * Хук для загрузки и управления данными перераспределения
 */

import { useState, useEffect } from 'react';
import { message } from 'antd';
import { supabase } from '../../../lib/supabase';
import type { Tender } from '../../../lib/supabase';
import type { BoqItemWithCosts } from '../utils';

export interface MarkupTactic {
  id: string;
  name: string;
  is_global: boolean;
  tender_id: string | null;
}

export interface ClientPosition {
  id: string;
  tender_id: string;
  position_number: number;
  section_number: string | null;
  position_name: string;
  unit_code: string;
  volume: number | null;
  manual_volume: number | null;
  manual_note: string | null;
  item_no: string | null;
  work_name: string;
  parent_position_id: string | null;
  is_additional: boolean;
  hierarchy_level: number;
}

export function useRedistributionData() {
  const [loading, setLoading] = useState(false);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string | undefined>();
  const [markupTactics, setMarkupTactics] = useState<MarkupTactic[]>([]);
  const [selectedTacticId, setSelectedTacticId] = useState<string | undefined>();
  const [boqItems, setBoqItems] = useState<BoqItemWithCosts[]>([]);
  const [clientPositions, setClientPositions] = useState<ClientPosition[]>([]);

  // Загрузка списка тендеров и тактик при монтировании
  useEffect(() => {
    loadTenders();
    loadMarkupTactics();
  }, []);

  // Загрузка BOQ элементов при выборе тендера
  useEffect(() => {
    if (selectedTenderId) {
      loadBoqItems(selectedTenderId);
      loadClientPositions(selectedTenderId);

      // Установить тактику из тендера
      const tender = tenders.find(t => t.id === selectedTenderId);
      if (tender?.markup_tactic_id) {
        setSelectedTacticId(tender.markup_tactic_id);
      } else {
        setSelectedTacticId(undefined);
      }
    } else {
      setBoqItems([]);
      setClientPositions([]);
    }
  }, [selectedTenderId, tenders]);

  const loadTenders = async () => {
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

  const loadMarkupTactics = async () => {
    try {
      const { data, error } = await supabase
        .from('markup_tactics')
        .select('*')
        .order('is_global', { ascending: false })
        .order('name');

      if (error) throw error;
      setMarkupTactics(data || []);
    } catch (error) {
      console.error('Ошибка загрузки тактик наценок:', error);
      message.error('Не удалось загрузить список тактик');
    }
  };

  const loadBoqItems = async (tenderId: string) => {
    setLoading(true);
    try {
      console.log('🔄 Загрузка BOQ элементов для тендера:', tenderId);

      const { data, error } = await supabase
        .from('boq_items')
        .select('id, client_position_id, detail_cost_category_id, boq_item_type, total_commercial_work_cost, total_commercial_material_cost')
        .eq('tender_id', tenderId);

      if (error) throw error;

      console.log(`📝 Загружено BOQ элементов: ${data?.length || 0}`);

      // Загружаем ВСЕ элементы (не только с категорией затрат)
      // Это нужно для корректного отображения итоговых стоимостей работ и материалов
      setBoqItems((data || []) as any);
    } catch (error) {
      console.error('Ошибка загрузки BOQ элементов:', error);
      message.error('Не удалось загрузить элементы BOQ');
    } finally {
      setLoading(false);
    }
  };

  const loadClientPositions = async (tenderId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_positions')
        .select('*')
        .eq('tender_id', tenderId)
        .order('position_number');

      if (error) throw error;
      setClientPositions(data || []);
    } catch (error) {
      console.error('Ошибка загрузки позиций заказчика:', error);
      message.error('Не удалось загрузить позиции заказчика');
    }
  };

  const handleTacticChange = (tacticId: string) => {
    setSelectedTacticId(tacticId);
  };

  return {
    loading,
    tenders,
    selectedTenderId,
    setSelectedTenderId,
    markupTactics,
    selectedTacticId,
    handleTacticChange,
    boqItems,
    clientPositions,
    loadBoqItems,
  };
}
